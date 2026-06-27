import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ErrorEventPublishPayload } from '@ebest/error-log-types';
import type {
  ErrorEventListResult,
  ErrorEventQueryParams,
  ErrorEventWireDocument,
} from '@ebest/error-log-types';
import { encodeLogCursor, parseLogCursor } from '#src/shared/log-cursor.util';
import { buildErrorEventMongoFilter } from './error-event-query-filter.util';
import { buildErrorEventKey } from './error-event-key.util';
import {
  ErrorEvent,
  ErrorEventMongoDocument,
} from './schemas/error-event.schema';

@Injectable()
export class ErrorEventRepository {
  constructor(
    @InjectModel(ErrorEvent.name)
    private readonly model: Model<ErrorEventMongoDocument>,
  ) {}

  async upsertByEventKey(
    eventKey: string,
    doc: Omit<ErrorEvent, 'eventKey'> & { eventKey: string },
  ): Promise<ErrorEventMongoDocument> {
    return this.model
      .findOneAndUpdate(
        { eventKey },
        { $setOnInsert: doc },
        { upsert: true, new: true },
      )
      .exec() as Promise<ErrorEventMongoDocument>;
  }

  buildDocument(
    payload: ErrorEventPublishPayload,
    eventKey: string,
  ): ErrorEvent {
    const occurredAt = payload.occurredAt
      ? new Date(payload.occurredAt)
      : new Date();
    return {
      eventKey,
      occurredAt,
      ingestedAt: new Date(),
      requestId: payload.requestId,
      traceId: payload.traceId,
      service: payload.service,
      environment: payload.environment ?? 'dev',
      severity: payload.severity,
      errorType: payload.errorType,
      message: payload.message,
      stack: payload.stack,
      fingerprint: payload.fingerprint,
      http: payload.http,
      actor: payload.actor,
      context: payload.context,
      source: payload.source,
      tags: payload.tags,
    };
  }

  async queryEvents(
    params: ErrorEventQueryParams & { limit: number; hint?: string },
  ): Promise<ErrorEventListResult> {
    const filter = buildErrorEventMongoFilter({
      ...params,
      parseCursor: parseLogCursor,
    });

    const limit = Math.min(Math.max(params.limit, 1), 100);
    let query = this.model
      .find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    if (params.hint) {
      query = query.hint(params.hint);
    }
    const rows = await query.exec();

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];
    const nextCursor =
      hasMore && last?.occurredAt && last?._id
        ? encodeLogCursor(new Date(last.occurredAt), String(last._id))
        : undefined;

    return {
      data: data.map((row) => {
        const id = String(row._id);
        return {
          ...(row as unknown as ErrorEventWireDocument),
          _id: id,
          id,
          occurredAt:
            row.occurredAt instanceof Date
              ? row.occurredAt.toISOString()
              : String(row.occurredAt),
          ingestedAt:
            row.ingestedAt instanceof Date
              ? row.ingestedAt.toISOString()
              : row.ingestedAt
                ? String(row.ingestedAt)
                : undefined,
        };
      }),
      nextCursor,
      hasMore,
    };
  }

  async persistPayload(
    payload: ErrorEventPublishPayload,
    maxRetries: number,
  ): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const eventKey = buildErrorEventKey(payload);
        const doc = this.buildDocument(payload, eventKey);
        await this.upsertByEventKey(eventKey, doc);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 200 * attempt));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}
