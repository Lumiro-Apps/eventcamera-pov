export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];

export type QueryParams = Record<string, QueryValue>;

export interface HttpClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  credentials?: RequestCredentials;
}

export interface HttpRequestOptions {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  authToken?: string;
  signal?: AbortSignal;
  idempotencyKey?: string;
  responseType?: 'json' | 'text' | 'void';
  credentials?: RequestCredentials;
}
