import type { Types } from 'mongoose';

import {
  isExactLookupToken,
} from '#src/shared/log-query-text.util';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildTextSearchOrConditions(q: string): Record<string, unknown>[] {
  const trimmed = q.trim();
  const regex = new RegExp(escapeRegex(trimmed), 'i');
  const or: Record<string, unknown>[] = [
    { summary: regex },
    { action: regex },
    { requestId: regex },
    { correlationId: regex },
    { eventKey: regex },
    { 'snapshots.invoice.invoiceNumber': regex },
    { 'snapshots.customer.displayName': regex },
    { 'snapshots.invoice.customerDisplayName': regex },
    { 'snapshots.class.code': regex },
    { 'snapshots.class.name': regex },
    { 'snapshots.targetClass.code': regex },
    { 'snapshots.targetClass.name': regex },
    { 'actor.displayName': regex },
    { module: regex },
    { endpoint: regex },
  ];

  const num = Number(trimmed);
  if (Number.isInteger(num) && num > 0) {
    or.push(
      { 'refs.customerId': num },
      { 'refs.invoiceId': num },
      { 'refs.classId': num },
      { 'refs.targetClassId': num },
      { 'actor.userId': num },
    );
  }

  return or;
}

function buildActivityQFilter(q: string): Record<string, unknown> {
  const trimmed = q.trim();
  if (!trimmed) {
    return {};
  }
  if (isExactLookupToken(trimmed)) {
    return {
      $or: [
        { requestId: trimmed },
        { correlationId: trimmed },
        { eventKey: trimmed },
        ...buildTextSearchOrConditions(trimmed),
      ],
    };
  }
  return { $or: buildTextSearchOrConditions(trimmed) };
}

export function buildActivityEventMongoFilter(params: {
  cursor?: string;
  customerId?: number;
  invoiceId?: number;
  classId?: number;
  userId?: number;
  category?: string;
  action?: string;
  module?: string;
  severity?: string;
  from?: string;
  to?: string;
  requestId?: string;
  q?: string;
  parseCursor: (cursor: string) => { occurredAt: Date; id: Types.ObjectId } | null;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [];

  if (params.customerId) {
    base['refs.customerId'] = params.customerId;
  }
  if (params.invoiceId) {
    base['refs.invoiceId'] = params.invoiceId;
  }
  if (params.userId) {
    base['actor.userId'] = params.userId;
  }
  if (params.category) {
    base.category = params.category;
  }
  if (params.action) {
    base.action = params.action;
  }
  if (params.module) {
    base.module = params.module;
  }
  if (params.severity) {
    base.severity = params.severity;
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

  if (Object.keys(base).length > 0) {
    andClauses.push(base);
  }

  if (params.classId) {
    andClauses.push({
      $or: [
        { 'refs.classId': params.classId },
        { 'refs.targetClassId': params.classId },
      ],
    });
  }

  if (params.q?.trim()) {
    andClauses.push(buildActivityQFilter(params.q));
  }

  if (params.cursor) {
    const parsed = params.parseCursor(params.cursor);
    if (parsed) {
      andClauses.push({
        $or: [
          { occurredAt: { $lt: parsed.occurredAt } },
          { occurredAt: parsed.occurredAt, _id: { $lt: parsed.id } },
        ],
      });
    }
  }

  if (andClauses.length === 0) {
    return {};
  }
  if (andClauses.length === 1) {
    return andClauses[0];
  }
  return { $and: andClauses };
}
