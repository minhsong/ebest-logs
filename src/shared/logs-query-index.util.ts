import type { ActivityEventQueryParams } from '@ebest/activity-log-types';
import type { ErrorEventQueryParams } from '@ebest/error-log-types';
import { isExactLookupToken } from '#src/shared/log-query-text.util';

const ACTIVITY_SORT = { occurredAt: -1, _id: -1 } as const;

function blocksIndexHint(q?: string): boolean {
  const trimmed = q?.trim();
  if (!trimmed) {
    return false;
  }
  return !isExactLookupToken(trimmed);
}

/** Gợi ý index MongoDB theo filter — giảm in-memory sort khi có equality + pagination. */
export function resolveActivityEventQueryHint(
  params: ActivityEventQueryParams,
): string | undefined {
  if (blocksIndexHint(params.q)) {
    return undefined;
  }
  if (params.requestId) {
    return 'requestId_1_occurredAt_-1__id_-1';
  }
  if (params.customerId) {
    return 'refs.customerId_1_occurredAt_-1';
  }
  if (params.invoiceId) {
    return 'refs.invoiceId_1_occurredAt_-1';
  }
  if (params.classId) {
    return 'refs.classId_1_occurredAt_-1';
  }
  if (params.userId) {
    return 'actor.userId_1_occurredAt_-1';
  }
  if (params.module && params.severity) {
    return 'module_1_severity_1_occurredAt_-1__id_-1';
  }
  if (params.module) {
    return 'module_1_occurredAt_-1__id_-1';
  }
  if (params.severity) {
    return 'severity_1_occurredAt_-1__id_-1';
  }
  if (params.category) {
    return 'category_1_occurredAt_-1';
  }
  if (params.action) {
    return 'action_1_occurredAt_-1';
  }
  if (params.from || params.to) {
    return 'occurredAt_-1';
  }
  return 'occurredAt_-1';
}

export function resolveErrorEventQueryHint(
  params: ErrorEventQueryParams,
): string | undefined {
  if (blocksIndexHint(params.q)) {
    return undefined;
  }
  if (params.requestId) {
    return 'requestId_1_occurredAt_-1__id_-1';
  }
  if (params.fingerprint) {
    return 'fingerprint_1_occurredAt_-1';
  }
  if (params.service && params.severity) {
    return 'service_1_severity_1_occurredAt_-1__id_-1';
  }
  if (params.service) {
    return 'service_1_occurredAt_-1';
  }
  if (params.severity) {
    return 'severity_1_occurredAt_-1';
  }
  if (params.from || params.to) {
    return 'occurredAt_-1';
  }
  return 'occurredAt_-1';
}

export { ACTIVITY_SORT };
