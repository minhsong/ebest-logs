import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import type { AllConfigType } from '#src/config/config.type';
import { KeyBuilder } from './utils/key-builder.util';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private blockingClient: Redis | null = null;
  private keyBuilder: KeyBuilder;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    const config = this.configService.getOrThrow('redis', { infer: true });
    this.keyBuilder = new KeyBuilder(config.keyPrefix);
  }

  get redis(): Redis | null {
    return this.client;
  }

  get blockingRedis(): Redis | null {
    return this.blockingClient;
  }

  async onModuleInit(): Promise<void> {
    const config = this.configService.getOrThrow('redis', { infer: true });
    if (!config.enabled) {
      this.logger.warn('Redis disabled');
      return;
    }
    try {
      await this.connect();
    } catch (error) {
      this.logger.error(
        `Redis connect failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  async ping(): Promise<string> {
    if (!this.client || !this.isConnected()) {
      return 'DISABLED';
    }
    try {
      return await this.client.ping();
    } catch {
      return 'ERROR';
    }
  }

  async connect(): Promise<void> {
    const config = this.configService.getOrThrow('redis', { infer: true });
    if (!config.enabled) {
      return;
    }
    await this.disconnect();

    const shared: Pick<
      RedisOptions,
      'host' | 'port' | 'password' | 'db' | 'connectTimeout' | 'lazyConnect'
    > = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      connectTimeout: config.connectTimeout,
      lazyConnect: true,
    };

    const retryStrategy = config.retryStrategy
      ? (times: number) => Math.min(times * 50, 2000)
      : undefined;

    const baseOpts = {
      ...shared,
      retryStrategy,
      maxRetriesPerRequest: config.maxRetries,
      enableReadyCheck: true,
      enableOfflineQueue: false,
    };

    this.client = new Redis({
      ...baseOpts,
      commandTimeout: config.commandTimeout,
    });
    this.blockingClient = new Redis({ ...baseOpts });

    await Promise.all([this.client.connect(), this.blockingClient.connect()]);
    this.logger.log('Redis connected (cache + blocking)');
  }

  async disconnect(): Promise<void> {
    const clients = [this.client, this.blockingClient].filter(Boolean);
    for (const c of clients) {
      try {
        await c!.quit();
      } catch {
        c!.disconnect();
      }
    }
    this.client = null;
    this.blockingClient = null;
  }

  /** Absolute stream key — không thêm prefix (đồng bộ với CRM publisher). */
  resolveStreamKey(absoluteKey: string): string {
    return absoluteKey;
  }

  async ensureConsumerGroup(
    streamKey: string,
    group: string,
  ): Promise<void> {
    if (!this.client || !this.isConnected()) {
      return;
    }
    try {
      await this.client.xgroup(
        'CREATE',
        streamKey,
        group,
        '0',
        'MKSTREAM',
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes('BUSYGROUP')) {
        throw error;
      }
    }
  }

  async xAddAbsolute(
    streamKey: string,
    fields: Record<string, string>,
    maxLen?: number,
  ): Promise<string | null> {
    if (!this.client || !this.isConnected()) {
      return null;
    }
    const args: (string | number)[] = [streamKey];
    if (maxLen && maxLen > 0) {
      args.push('MAXLEN', '~', maxLen);
    }
    args.push('*');
    for (const [k, v] of Object.entries(fields)) {
      args.push(k, v);
    }
    return this.client.xadd(...(args as [string, ...string[]]));
  }

  async xReadGroup(
    group: string,
    consumer: string,
    streamKey: string,
    count: number,
    blockMs: number,
  ): Promise<
    | {
        id: string;
        message: Record<string, string>;
      }[]
    | null
  > {
    const client = this.blockingClient ?? this.client;
    if (!client) {
      return null;
    }
    const result = await client.xreadgroup(
      'GROUP',
      group,
      consumer,
      'COUNT',
      count,
      'BLOCK',
      blockMs,
      'STREAMS',
      streamKey,
      '>',
    );
    if (!result || result.length === 0) {
      return null;
    }
    const [, messages] = result[0] as [string, [string, string[]][]];
    return messages.map(([id, raw]) => {
      const message: Record<string, string> = {};
      for (let i = 0; i < raw.length; i += 2) {
        message[raw[i]!] = raw[i + 1]!;
      }
      return { id, message };
    });
  }

  async xAck(
    streamKey: string,
    group: string,
    id: string,
  ): Promise<void> {
    if (!this.client || !this.isConnected()) {
      return;
    }
    await this.client.xack(streamKey, group, id);
  }

  buildKey(...parts: (string | number | undefined)[]): string {
    return this.keyBuilder.build(...parts);
  }
}
