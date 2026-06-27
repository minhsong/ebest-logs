import { registerAs } from '@nestjs/config';
import type { ActivityLogIngestConfig } from './activity-log-config.type';

const ingestModeRaw = process.env.ACTIVITY_LOG_INGEST_MODE || 'redis';

export default registerAs<ActivityLogIngestConfig>('activityLog', () => ({
  redisStream:
    process.env.ACTIVITY_LOG_REDIS_STREAM || 'ebest-crm:activity:events',
  consumerGroup:
    process.env.ACTIVITY_LOG_CONSUMER_GROUP || 'activity-log-workers',
  consumerName:
    process.env.ACTIVITY_LOG_CONSUMER_NAME ||
    `worker-${process.pid}`,
  consumerBatchSize: parseInt(
    process.env.ACTIVITY_LOG_CONSUMER_BATCH_SIZE || '20',
    10,
  ),
  consumerBlockMs: parseInt(
    process.env.ACTIVITY_LOG_CONSUMER_BLOCK_MS || '5000',
    10,
  ),
  streamMaxLen: parseInt(
    process.env.ACTIVITY_LOG_STREAM_MAXLEN || '100000',
    10,
  ),
  deadLetterStream:
    process.env.ACTIVITY_LOG_DEAD_LETTER_STREAM ||
    'ebest-crm:activity:dead',
  retentionDays: parseInt(
    process.env.ACTIVITY_LOG_RETENTION_DAYS || '365',
    10,
  ),
  internalApiKey:
    process.env.INTERNAL_API_KEY?.trim() ||
    process.env.ACTIVITY_LOG_INTERNAL_API_KEY?.trim() ||
    '',
  maxIngestRetries: parseInt(
    process.env.ACTIVITY_LOG_INGEST_MAX_RETRIES || '3',
    10,
  ),
  ingestMode:
    ingestModeRaw === 'file' ? 'file' : ('redis' as const),
  fileIngestPath:
    process.env.ACTIVITY_LOG_FILE_INGEST_PATH?.trim() || '',
}));
