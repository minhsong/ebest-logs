import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ActivityEventPublishPayload } from '@ebest/crm-api-types/events/activity-log';
import type { ActivityEventListResult, ActivityEventQueryParams, ActivityEventWireDocument } from '@ebest/activity-log-types';
import {
  encodeActivityLogCursor,
  parseActivityLogCursor,
} from './activity-log-cursor.util';
import { buildActivityEventMongoFilter } from './activity-event-query-filter.util';
import {
  ActivityEvent,
  ActivityEventMongoDocument,
} from './schemas/activity-event.schema';

@Injectable()
export class ActivityEventRepository {
  constructor(
    @InjectModel(ActivityEvent.name)
    private readonly model: Model<ActivityEventMongoDocument>,
  ) {}

  async upsertByEventKey(
    eventKey: string,
    doc: Omit<ActivityEvent, 'eventKey'> & { eventKey: string },
  ): Promise<ActivityEventMongoDocument> {
    return this.model
      .findOneAndUpdate(
        { eventKey },
        { $setOnInsert: doc },
        { upsert: true, new: true },
      )
      .exec() as Promise<ActivityEventMongoDocument>;
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

  async queryEvents(
    params: ActivityEventQueryParams & { limit: number; hint?: string },
  ): Promise<ActivityEventListResult> {
    const filter = buildActivityEventMongoFilter({
      ...params,
      parseCursor: parseActivityLogCursor,
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
        ? encodeActivityLogCursor(
            new Date(last.occurredAt),
            String(last._id),
          )
        : undefined;

    return {
      data: data.map((row) => {
        const id = String(row._id);
        return {
          ...(row as unknown as ActivityEventWireDocument),
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
}
