import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { AllConfigType } from '#src/config/config.type';
import {
  ActivityEvent,
  ActivityEventMongoDocument,
} from '#src/events/schemas/activity-event.schema';
import {
  ErrorEvent,
  ErrorEventMongoDocument,
} from '#src/error-log/events/schemas/error-event.schema';

@Injectable()
export class LogsIndexSyncService implements OnModuleInit {
  private readonly logger = new Logger(LogsIndexSyncService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    @InjectModel(ActivityEvent.name)
    private readonly activityModel: Model<ActivityEventMongoDocument>,
    @InjectModel(ErrorEvent.name)
    private readonly errorModel: Model<ErrorEventMongoDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const mongo = this.configService.get('mongo', { infer: true });
    if (!mongo?.enabled) {
      return;
    }

    try {
      await this.activityModel.syncIndexes();
      await this.errorModel.syncIndexes();
      this.logger.log('MongoDB indexes synced (activity_events, error_events)');
    } catch (error) {
      this.logger.warn(
        `MongoDB index sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
