export type ErrorLogServiceName =
  | 'crm-api'
  | 'crm-client'
  | 'social-gateway'
  | 'student-portal'
  | 'ebest-logs';

export type ErrorLogSeverity = 'warning' | 'error' | 'fatal';

export type ErrorLogSource = 'http' | 'job' | 'client' | 'ingest' | 'system';

export interface ErrorLogHttpContext {
  method?: string;
  path?: string;
  statusCode?: number;
}

export interface ErrorLogActor {
  userId?: number;
  customerId?: number;
  displayName?: string;
}

/** Payload producers push qua Redis Stream (fire-and-forget). */
export interface ErrorEventPublishPayload {
  occurredAt?: string;
  requestId?: string;
  traceId?: string;

  service: ErrorLogServiceName;
  environment?: 'dev' | 'staging' | 'prod';

  severity: ErrorLogSeverity;
  errorType: string;
  message: string;
  stack?: string;
  fingerprint: string;

  http?: ErrorLogHttpContext;
  actor?: ErrorLogActor;
  context?: Record<string, unknown>;
  source: ErrorLogSource;
  tags?: string[];
}
