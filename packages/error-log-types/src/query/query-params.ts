import type { ErrorLogServiceName, ErrorLogSeverity } from '../publish/envelope';

export interface ErrorEventQueryParams {
  cursor?: string;
  limit?: number;
  service?: ErrorLogServiceName | string;
  severity?: ErrorLogSeverity | string;
  fingerprint?: string;
  requestId?: string;
  from?: string;
  to?: string;
  q?: string;
}
