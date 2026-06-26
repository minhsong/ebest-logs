import { Module } from '@nestjs/common';
import { EventsModule } from '#src/events/events.module';
import { ActivityEventQueryController } from './activity-event-query.controller';
import { ActivityEventQueryService } from './activity-event-query.service';

@Module({
  imports: [EventsModule],
  controllers: [ActivityEventQueryController],
  providers: [ActivityEventQueryService],
})
export class QueryModule {}
