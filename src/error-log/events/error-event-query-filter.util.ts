import type { Types } from 'mongoose';

import {
  isExactLookupToken,
  isLikelyFingerprint,
} from '#src/shared/log-query-text.util';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildErrorQFilter(q: string): Record<string, unknown> {
  const trimmed = q.trim();
  if (!trimmed) {
    return {};
  }
  const regex = new RegExp(escapeRegex(trimmed), 'i');
  const regexOr = [
    { message: regex },
    { errorType: regex },
    { requestId: regex },
    { fingerprint: regex },
    { 'http.path': regex },
  ];
  if (isLikelyFingerprint(trimmed)) {
    return { $or: [{ fingerprint: trimmed }, ...regexOr] };
  }
  if (isExactLookupToken(trimmed)) {
    return {
      $or: [{ requestId: trimmed }, { fingerprint: trimmed }, ...regexOr],
    };
  }
  return { $or: regexOr };
}

export function buildErrorEventMongoFilter(params: {
  cursor?: string;
  service?: string;
  severity?: string;
  fingerprint?: string;
  requestId?: string;
  from?: string;
  to?: string;
  q?: string;
  parseCursor: (cursor: string) => { occurredAt: Date; id: Types.ObjectId } | null;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [];

  if (params.service) {
    base.service = params.service;
  }
  if (params.severity) {
    base.severity = params.severity;
  }
  if (params.fingerprint) {
    base.fingerprint = params.fingerprint;
  }
  if (params.requestId) {
    base.requestId = params.requestId;
  }
  if (params.from || params.to) {
    base.occurredAt = {};
    if (params.from) {
      (base.occurredAt as Record<string, Date>).$gte = new Date(params.from);
    }
    if (params.to) {
      (base.occurredAt as Record<string, Date>).$lte = new Date(params.to);
    }
  }

  if (params.cursor) {
    const parsed = params.parseCursor(params.cursor);
    if (parsed) {
      andClauses.push({
        $or: [
          { occurredAt: { $lt: parsed.occurredAt } },
          {
            occurredAt: parsed.occurredAt,
            _id: { $lt: parsed.id },
          },
        ],
      });
    }
  }

  if (params.q?.trim()) {
    andClauses.push(buildErrorQFilter(params.q));
  }

  if (andClauses.length) {
    return { $and: [base, ...andClauses] };
  }
  return base;
}
