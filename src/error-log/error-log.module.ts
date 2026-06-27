import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ErrorEvent,
  ErrorEventSchema,
} from '#src/error-log/events/schemas/error-event.schema';
import { ErrorEventRepository } from '#src/error-log/events/error-event.repository';
import { ErrorStreamIngestService } from '#src/error-log/ingest/error-stream-ingest.service';
import { ErrorLogFileIngestService } from '#src/error-log/ingest/error-log-file-ingest.service';
import { ErrorEventQueryController } from '#src/error-log/query/error-event-query.controller';
import { ErrorEventQueryService } from '#src/error-log/query/error-event-query.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ErrorEvent.name, schema: ErrorEventSchema },
    ]),
  ],
  controllers: [ErrorEventQueryController],
  providers: [
    ErrorEventRepository,
    ErrorStreamIngestService,
    ErrorLogFileIngestService,
    ErrorEventQueryService,
  ],
  exports: [ErrorEventRepository],
})
export class ErrorLogModule {}
