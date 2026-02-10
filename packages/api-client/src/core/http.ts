import { ApiClientError, type ErrorEnvelope } from './errors';
import type {
  HttpClientConfig,
  HttpRequestOptions,
  QueryParams,
  QueryPrimitive,
  QueryValue
} from './types';

export type { HttpClientConfig, HttpMethod, HttpRequestOptions, QueryParams } from './types';
export { ApiClientError } from './errors';

function appendQueryValue(searchParams: URLSearchParams, key: string, value: QueryPrimitive): void {
  if (value === undefined || value === null) return;
  searchParams.append(key, String(value));
}

function applyQuery(searchParams: URLSearchParams, query?: QueryParams): void {
  if (!query) return;

  for (const [key, raw] of Object.entries(query)) {
    const value: QueryValue = raw;
    if (Array.isArray(value)) {
      for (const item of value) {
        appendQueryValue(searchParams, key, item);
      }
      continue;
    }

    appendQueryValue(searchParams, key, value);
  }
}

function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  const url = new URL(normalizedPath, normalizedBase);
  applyQuery(url.searchParams, query);
  return url.toString();
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

function createAbortSignal(timeoutMs: number | undefined, externalSignal?: AbortSignal): AbortSignal | undefined {
  if (!timeoutMs && !externalSignal) return externalSignal;

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  if (timeoutId) {
    controller.signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId);
      },
      { once: true }
    );
  }

  return controller.signal;
}

function toApiClientError(statusCode: number, payload: unknown): ApiClientError {
  const envelope = payload as ErrorEnvelope;

  const code = envelope?.error?.code ?? 'API_ERROR';
  const message = envelope?.error?.message ?? 'Request failed';
  const requestId = envelope?.error?.request_id ?? null;
  const details = envelope?.error?.details ?? {};

  return new ApiClientError({
    statusCode,
    code,
    message,
    requestId,
    details,
    causeData: payload
  });
}

export interface HttpClient {
  request<TResponse>(options: HttpRequestOptions): Promise<TResponse>;
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const baseUrl = config.baseUrl;
  const fetchImpl = config.fetchImpl ?? fetch;

  if (!baseUrl) {
    throw new Error('HttpClient requires a baseUrl');
  }

  return {
    async request<TResponse>(options: HttpRequestOptions): Promise<TResponse> {
      const headers = new Headers(config.defaultHeaders ?? {});

      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          headers.set(key, value);
        }
      }

      if (options.authToken) {
        headers.set('Authorization', `Bearer ${options.authToken}`);
      }

      if (options.idempotencyKey) {
        headers.set('Idempotency-Key', options.idempotencyKey);
      }

      let body: BodyInit | undefined;
      if (options.body !== undefined) {
        if (options.body instanceof FormData) {
          body = options.body;
        } else {
          if (!headers.has('content-type')) {
            headers.set('content-type', 'application/json');
          }
          body = JSON.stringify(options.body);
        }
      }

      const url = buildUrl(baseUrl, options.path, options.query);
      const signal = createAbortSignal(config.timeoutMs, options.signal);

      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: options.method,
          headers,
          body,
          signal,
          credentials: options.credentials ?? config.credentials
        });
      } catch (error) {
        throw new ApiClientError({
          statusCode: 0,
          code: 'NETWORK_ERROR',
          message: 'Network request failed',
          causeData: error
        });
      }

      const payload = await parseBody(response);

      if (!response.ok) {
        throw toApiClientError(response.status, payload);
      }

      if (options.responseType === 'void') {
        return undefined as TResponse;
      }

      if (options.responseType === 'text') {
        return String(payload ?? '') as TResponse;
      }

      return payload as TResponse;
    }
  };
}
