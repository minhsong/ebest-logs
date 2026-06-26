import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ActivityEventPublishPayload } from '@ebest/activity-log-contract';
import {
  encodeActivityLogCursor,
  parseActivityLogCursor,
} from './activity-log-cursor.util';
import { buildActivityEventMongoFilter } from './activity-event-query-filter.util';
import {
  ActivityEvent,
  ActivityEventDocument,
} from './schemas/activity-event.schema';

export interface ActivityEventListResult {
  data: Array<Record<string, unknown> & { id: string }>;
  nextCursor?: string;
  hasMore: boolean;
}

@Injectable()
export class ActivityEventRepository {
  constructor(
    @InjectModel(ActivityEvent.name)
    private readonly model: Model<ActivityEventDocument>,
  ) {}

  async upsertByEventKey(
    eventKey: string,
    doc: Omit<ActivityEvent, 'eventKey'> & { eventKey: string },
  ): Promise<ActivityEventDocument> {
    return this.model
      .findOneAndUpdate(
        { eventKey },
        { $setOnInsert: doc },
        { upsert: true, new: true },
      )
      .exec() as Promise<ActivityEventDocument>;
  }

  buildDocument(
    payload: ActivityEventPublishPayload,
    eventKey: string,
  ): ActivityEvent {
    const occurredAt = payload.occurredAt
      ? new Date(payload.occurredAt)
      : new Date();
    return {
      eventKey,
      occurredAt,
      ingestedAt: new Date(),
      requestId: payload.requestId,
      correlationId: payload.correlationId,
      actor: payload.actor,
      action: payload.action,
      category: payload.category,
      severity: payload.severity,
      refs: payload.refs,
      snapshots: payload.snapshots,
      summary: payload.summary,
      change: payload.change,
      source: payload.source,
      module: payload.module,
      endpoint: payload.endpoint,
      tags: payload.tags,
    };
  }

  async queryEvents(params: {
    cursor?: string;
    limit: number;
    customerId?: number;
    invoiceId?: number;
    classId?: number;
    userId?: number;
    category?: string;
    action?: string;
    from?: string;
    to?: string;
    requestId?: string;
    q?: string;
  }): Promise<ActivityEventListResult> {
    const filter = buildActivityEventMongoFilter({
      ...params,
      parseCursor: parseActivityLogCursor,
    });

    const limit = Math.min(Math.max(params.limit, 1), 100);
    const rows = await this.model
      .find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];
    const nextCursor =
      hasMore && last?.occurredAt && last?._id
        ? encodeActivityLogCursor(
            new Date(last.occurredAt),
            String(last._id),
          )
        : undefined;

    return {
      data: data.map((row) => ({
        id: String(row._id),
        ...row,
      })),
      nextCursor,
      hasMore,
    };
  }
}
