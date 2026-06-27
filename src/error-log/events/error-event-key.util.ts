import { createHash } from 'node:crypto';
import type { ErrorEventPublishPayload } from '@ebest/error-log-types';

export function buildErrorEventKey(payload: ErrorEventPublishPayload): string {
  const raw = [
    payload.fingerprint,
    payload.requestId ?? '',
    payload.occurredAt ?? '',
  ].join('|');
  return createHash('sha256').update(raw).digest('hex');
}
