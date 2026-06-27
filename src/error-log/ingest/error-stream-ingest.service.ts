import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AllConfigType } from '#src/config/config.type';
import { RedisService } from '#src/redis/redis.service';
import { runRedisStreamConsumerLoop } from '#src/shared/redis-stream-consumer.loop';
import { ErrorEventRepository } from '#src/error-log/events/error-event.repository';
import { ingestErrorStreamMessage } from './error-stream-ingest.handler';

@Injectable()
export class ErrorStreamIngestService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ErrorStreamIngestService.name);
  private running = false;
  private loopPromise: Promise<void> | null = null;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly redisService: RedisService,
    private readonly eventRepository: ErrorEventRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const mongo = this.configService.get('mongo', { infer: true });
    if (!mongo?.enabled) {
      this.logger.warn('Mongo disabled — error ingest worker not started');
      return;
    }

    const cfg = this.configService.getOrThrow('errorLog', { infer: true });
    if (cfg.ingestMode !== 'redis') {
      this.logger.log('Error Redis ingest skipped — ERROR_LOG_INGEST_MODE=file');
      return;
    }

    this.running = true;
    await this.redisService.ensureConsumerGroup(
      cfg.redisStream,
      cfg.consumerGroup,
    );
    this.loopPromise = runRedisStreamConsumerLoop({
      running: () => this.running,
      redisService: this.redisService,
      stream: cfg.redisStream,
      group: cfg.consumerGroup,
      consumer: cfg.consumerName,
      batchSize: 20,
      blockMs: 5000,
      onMessage: (item) =>
        ingestErrorStreamMessage({
          id: item.id,
          message: item.message,
          cfg,
          redisService: this.redisService,
          eventRepository: this.eventRepository,
          maxRetries: cfg.maxIngestRetries,
          logger: this.logger,
        }),
      onLoopError: (error) => {
        this.logger.warn(
          `Error ingest loop: ${error instanceof Error ? error.message : String(error)}`,
        );
      },
    });
    this.logger.log(
      `Error ingest started — stream=${cfg.redisStream} group=${cfg.consumerGroup}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    if (this.loopPromise) {
      await this.loopPromise.catch(() => undefined);
    }
  }
}
