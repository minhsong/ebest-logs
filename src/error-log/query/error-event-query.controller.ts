import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '#src/guards/internal-api-key.guard';
import type { ErrorEventListResult } from '@ebest/error-log-types';
import { ErrorEventQueryService } from './error-event-query.service';
import { ErrorEventQueryDto } from './dto/error-event-query.dto';

@ApiTags('internal-error-events')
@ApiSecurity('internal-api-key')
@Controller('internal/v1/errors')
@UseGuards(InternalApiKeyGuard)
export class ErrorEventQueryController {
  constructor(private readonly queryService: ErrorEventQueryService) {}

  @Get()
  @ApiOperation({ summary: 'Query error events (internal — CRM proxy only)' })
  list(@Query() query: ErrorEventQueryDto): Promise<ErrorEventListResult> {
    return this.queryService.list(query);
  }
}
