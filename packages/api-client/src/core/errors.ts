export interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    request_id?: string | null;
    details?: Record<string, unknown>;
  };
}

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly details: Record<string, unknown>;
  readonly causeData: unknown;

  constructor(params: {
    statusCode: number;
    code: string;
    message: string;
    requestId?: string | null;
    details?: Record<string, unknown>;
    causeData?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiClientError';
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.requestId = params.requestId ?? null;
    this.details = params.details ?? {};
    this.causeData = params.causeData;
  }
}
