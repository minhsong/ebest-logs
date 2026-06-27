import type { AppConfig } from './app-config.type';
import type { MongoConfig } from './mongo-config.type';
import type { RedisConfig } from './redis-config.type';
import type { ActivityLogIngestConfig } from './activity-log-config.type';
import type { ErrorLogIngestConfig } from './error-log-config.type';
import type { LogsSharedConfig } from './logs-shared-config.type';

export type AllConfigType = {
  app: AppConfig;
  mongo: MongoConfig;
  redis: RedisConfig;
  logsShared: LogsSharedConfig;
  activityLog: ActivityLogIngestConfig;
  errorLog: ErrorLogIngestConfig;
};
