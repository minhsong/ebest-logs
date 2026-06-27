import { Injectable } from '@nestjs/common';
import { ErrorEventRepository } from '#src/error-log/events/error-event.repository';
import type { ErrorEventListResult } from '@ebest/error-log-types';
import { ErrorEventQueryDto } from './dto/error-event-query.dto';

@Injectable()
export class ErrorEventQueryService {
  constructor(private readonly eventRepository: ErrorEventRepository) {}

  list(query: ErrorEventQueryDto): Promise<ErrorEventListResult> {
    return this.eventRepository.queryEvents({
      cursor: query.cursor,
      limit: query.limit ?? 50,
      service: query.service,
      severity: query.severity,
      fingerprint: query.fingerprint,
      requestId: query.requestId,
      from: query.from,
      to: query.to,
      q: query.q,
    });
  }
}
