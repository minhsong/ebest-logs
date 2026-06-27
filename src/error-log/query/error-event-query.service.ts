import { Injectable } from '@nestjs/common';
import { ErrorEventRepository } from '#src/error-log/events/error-event.repository';
import type { ErrorEventListResult } from '@ebest/error-log-types';
import { resolveErrorEventQueryHint } from '#src/shared/logs-query-index.util';
import { LogsQueryCacheService } from '#src/shared/logs-query-cache.service';
import { ErrorEventQueryDto } from './dto/error-event-query.dto';

@Injectable()
export class ErrorEventQueryService {
  constructor(
    private readonly eventRepository: ErrorEventRepository,
    private readonly queryCache: LogsQueryCacheService,
  ) {}

  async list(query: ErrorEventQueryDto): Promise<ErrorEventListResult> {
    const params = {
      cursor: query.cursor,
      limit: query.limit ?? 50,
      service: query.service,
      severity: query.severity,
      fingerprint: query.fingerprint,
      requestId: query.requestId,
      from: query.from,
      to: query.to,
      q: query.q,
    };

    const cached = await this.queryCache.get<ErrorEventListResult>(
      'error',
      params,
    );
    if (cached) {
      return cached;
    }

    const result = await this.eventRepository.queryEvents({
      ...params,
      hint: resolveErrorEventQueryHint(params),
    });
    await this.queryCache.set('error', params, result);
    return result;
  }
}
