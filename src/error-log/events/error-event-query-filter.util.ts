import type { Types } from 'mongoose';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    const regex = new RegExp(escapeRegex(params.q.trim()), 'i');
    andClauses.push({
      $or: [
        { message: regex },
        { errorType: regex },
        { requestId: regex },
        { fingerprint: regex },
        { 'http.path': regex },
      ],
    });
  }

  if (andClauses.length) {
    return { $and: [base, ...andClauses] };
  }
  return base;
}
