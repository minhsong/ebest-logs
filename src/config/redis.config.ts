import { registerAs } from '@nestjs/config';
import type { RedisConfig } from './redis-config.type';

export default registerAs<RedisConfig>('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'ebest-activity-log:',
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
  retryStrategy: process.env.REDIS_RETRY_STRATEGY === 'true',
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
  enabled: process.env.REDIS_ENABLED !== 'false',
}));
