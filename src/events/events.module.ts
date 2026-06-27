import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ActivityEvent,
  ActivityEventSchema,
} from '#src/events/schemas/activity-event.schema';
import {
  ErrorEvent,
  ErrorEventSchema,
} from '#src/error-log/events/schemas/error-event.schema';
import { ActivityEventRepository } from '#src/events/activity-event.repository';
import { ActivityStreamIngestService } from '#src/ingest/activity-stream-ingest.service';
import { ActivityLogFileIngestService } from '#src/ingest/activity-log-file-ingest.service';
import { LogsIndexSyncService } from '#src/shared/logs-index-sync.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityEvent.name, schema: ActivityEventSchema },
      { name: ErrorEvent.name, schema: ErrorEventSchema },
    ]),
  ],
  providers: [
    ActivityEventRepository,
    ActivityStreamIngestService,
    ActivityLogFileIngestService,
    LogsIndexSyncService,
  ],
  exports: [ActivityEventRepository],
})
export class EventsModule {}
