import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ActivityEvent,
  ActivityEventSchema,
} from '#src/events/schemas/activity-event.schema';
import { ActivityEventRepository } from '#src/events/activity-event.repository';
import { ActivityStreamIngestService } from '#src/ingest/activity-stream-ingest.service';
import { ActivityLogFileIngestService } from '#src/ingest/activity-log-file-ingest.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityEvent.name, schema: ActivityEventSchema },
    ]),
  ],
  providers: [
    ActivityEventRepository,
    ActivityStreamIngestService,
    ActivityLogFileIngestService,
  ],
  exports: [ActivityEventRepository],
})
export class EventsModule {}
