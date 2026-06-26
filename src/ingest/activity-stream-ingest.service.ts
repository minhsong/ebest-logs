import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AllConfigType } from '#src/config/config.type';
import { RedisService } from '#src/redis/redis.service';
import { ActivityEventRepository } from '#src/events/activity-event.repository';
import { ingestActivityStreamMessage } from './activity-stream-ingest.handler';

@Injectable()
export class ActivityStreamIngestService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ActivityStreamIngestService.name);
  private running = false;
  private loopPromise: Promise<void> | null = null;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly redisService: RedisService,
    private readonly eventRepository: ActivityEventRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const mongo = this.configService.get('mongo', { infer: true });
    if (!mongo?.enabled) {
      this.logger.warn('Mongo disabled — ingest worker not started');
      return;
    }

    const cfg = this.configService.getOrThrow('activityLog', { infer: true });
    if (cfg.ingestMode !== 'redis') {
      this.logger.log('Redis ingest skipped — ACTIVITY_LOG_INGEST_MODE=file');
      return;
    }

    this.running = true;
    await this.redisService.ensureConsumerGroup(
      cfg.redisStream,
      cfg.consumerGroup,
    );
    this.loopPromise = this.consumeLoop();
    this.logger.log(
      `Ingest worker started — stream=${cfg.redisStream} group=${cfg.consumerGroup}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    if (this.loopPromise) {
      await this.loopPromise.catch(() => undefined);
    }
  }

  private async consumeLoop(): Promise<void> {
    const cfg = this.configService.getOrThrow('activityLog', { infer: true });
    while (this.running) {
      try {
        const batch = await this.redisService.xReadGroup(
          cfg.consumerGroup,
          cfg.consumerName,
          cfg.redisStream,
          20,
          5000,
        );
        if (!batch?.length) {
          continue;
        }
        for (const item of batch) {
          await ingestActivityStreamMessage({
            id: item.id,
            message: item.message,
            cfg,
            redisService: this.redisService,
            eventRepository: this.eventRepository,
            maxRetries: cfg.maxIngestRetries,
            logger: this.logger,
          });
        }
      } catch (error) {
        this.logger.warn(
          `Ingest loop error: ${error instanceof Error ? error.message : String(error)}`,
        );
        await sleep(1000);
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
