import { Injectable } from '@nestjs/common';
import { ActivityEventRepository } from '#src/events/activity-event.repository';
import type { ActivityEventListResult } from '@ebest/activity-log-types';
import { resolveActivityEventQueryHint } from '#src/shared/logs-query-index.util';
import { LogsQueryCacheService } from '#src/shared/logs-query-cache.service';
import { ActivityEventQueryDto } from './dto/activity-event-query.dto';

@Injectable()
export class ActivityEventQueryService {
  constructor(
    private readonly eventRepository: ActivityEventRepository,
    private readonly queryCache: LogsQueryCacheService,
  ) {}

  async list(query: ActivityEventQueryDto): Promise<ActivityEventListResult> {
    const params = {
      cursor: query.cursor,
      limit: query.limit ?? 50,
      customerId: query.customerId,
      invoiceId: query.invoiceId,
      classId: query.classId,
      userId: query.userId,
      category: query.category,
      action: query.action,
      module: query.module,
      severity: query.severity,
      from: query.from,
      to: query.to,
      requestId: query.requestId,
      q: query.q,
    };

    const cached = await this.queryCache.get<ActivityEventListResult>(
      'activity',
      params,
    );
    if (cached) {
      return cached;
    }

    const result = await this.eventRepository.queryEvents({
      ...params,
      hint: resolveActivityEventQueryHint(params),
    });
    await this.queryCache.set('activity', params, result);
    return result;
  }
}
