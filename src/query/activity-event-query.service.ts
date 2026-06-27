import { Injectable } from '@nestjs/common';
import { ActivityEventRepository } from '#src/events/activity-event.repository';
import type { ActivityEventListResult } from '@ebest/activity-log-types';
import { ActivityEventQueryDto } from './dto/activity-event-query.dto';

@Injectable()
export class ActivityEventQueryService {
  constructor(
    private readonly eventRepository: ActivityEventRepository,
  ) {}

  list(query: ActivityEventQueryDto): Promise<ActivityEventListResult> {
    return this.eventRepository.queryEvents({
      cursor: query.cursor,
      limit: query.limit ?? 50,
      customerId: query.customerId,
      invoiceId: query.invoiceId,
      classId: query.classId,
      userId: query.userId,
      category: query.category,
      action: query.action,
      from: query.from,
      to: query.to,
      requestId: query.requestId,
      q: query.q,
    });
  }
}
