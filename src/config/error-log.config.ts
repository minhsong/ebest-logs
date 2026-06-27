import { registerAs } from '@nestjs/config';
import type { ErrorLogIngestConfig } from './error-log-config.type';

const ingestModeRaw = process.env.ERROR_LOG_INGEST_MODE || 'redis';

export default registerAs<ErrorLogIngestConfig>('errorLog', () => ({
  redisStream: process.env.ERROR_LOG_REDIS_STREAM || 'ebest:system:errors',
  consumerGroup:
    process.env.ERROR_LOG_CONSUMER_GROUP || 'error-log-workers',
  consumerName:
    process.env.ERROR_LOG_CONSUMER_NAME || `error-worker-${process.pid}`,
  consumerBatchSize: parseInt(
    process.env.ERROR_LOG_CONSUMER_BATCH_SIZE || '20',
    10,
  ),
  consumerBlockMs: parseInt(
    process.env.ERROR_LOG_CONSUMER_BLOCK_MS || '5000',
    10,
  ),
  streamMaxLen: parseInt(process.env.ERROR_LOG_STREAM_MAXLEN || '100000', 10),
  deadLetterStream:
    process.env.ERROR_LOG_DEAD_LETTER_STREAM || 'ebest:system:errors:dead',
  retentionDays: parseInt(process.env.ERROR_LOG_RETENTION_DAYS || '90', 10),
  maxIngestRetries: parseInt(
    process.env.ERROR_LOG_INGEST_MAX_RETRIES || '3',
    10,
  ),
  ingestMode: ingestModeRaw === 'file' ? 'file' : ('redis' as const),
  fileIngestPath: process.env.ERROR_LOG_FILE_INGEST_PATH?.trim() || '',
}));
