import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '#src/guards/internal-api-key.guard';
import { ActivityEventQueryService } from './activity-event-query.service';
import { ActivityEventQueryDto } from './dto/activity-event-query.dto';
import type { ActivityEventListResult } from '@ebest/activity-log-types';

@ApiTags('internal-activity-events')
@ApiSecurity('internal-api-key')
@Controller('internal/v1/events')
@UseGuards(InternalApiKeyGuard)
export class ActivityEventQueryController {
  constructor(
    private readonly queryService: ActivityEventQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Query activity events (internal — CRM proxy only)' })
  list(@Query() query: ActivityEventQueryDto): Promise<ActivityEventListResult> {
    return this.queryService.list(query);
  }
}
