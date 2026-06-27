import { createHash } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AllConfigType } from '#src/config/config.type';
import { RedisService } from '#src/redis/redis.service';

function stableHash(input: Record<string, unknown>): string {
  const keys = Object.keys(input).sort();
  const normalized: Record<string, unknown> = {};
  for (const key of keys) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== '') {
      normalized[key] = value;
    }
  }
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex').slice(0, 32);
}

@Injectable()
export class LogsQueryCacheService {
  private readonly logger = new Logger(LogsQueryCacheService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly redisService: RedisService,
  ) {}

  private cfg() {
    return this.configService.get('logsQuery', { infer: true })!;
  }

  shouldUseCache(params: Record<string, unknown>): boolean {
    const cfg = this.cfg();
    if (!cfg.cacheEnabled) {
      return false;
    }
    if (cfg.cacheSkipWhenQ && params.q) {
      return false;
    }
    return true;
  }

  async get<T>(namespace: string, params: Record<string, unknown>): Promise<T | null> {
    if (!this.shouldUseCache(params)) {
      return null;
    }
    const key = this.redisService.buildKey('query', namespace, stableHash(params));
    try {
      return await this.redisService.getJson<T>(key);
    } catch (error) {
      this.logger.debug(
        `Cache get miss: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async set(
    namespace: string,
    params: Record<string, unknown>,
    value: unknown,
  ): Promise<void> {
    if (!this.shouldUseCache(params)) {
      return;
    }
    const cfg = this.cfg();
    const key = this.redisService.buildKey('query', namespace, stableHash(params));
    try {
      await this.redisService.setJson(key, value, cfg.cacheTtlSec);
    } catch (error) {
      this.logger.debug(
        `Cache set skip: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
