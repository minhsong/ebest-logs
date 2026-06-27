import type { AppConfig } from './app-config.type';
import type { MongoConfig } from './mongo-config.type';
import type { RedisConfig } from './redis-config.type';
import type { ActivityLogIngestConfig } from './activity-log-config.type';
import type { ErrorLogIngestConfig } from './error-log-config.type';
import type { LogsSharedConfig } from './logs-shared-config.type';
import type { LogsQueryConfig } from './logs-query-config.type';

export type AllConfigType = {
  app: AppConfig;
  mongo: MongoConfig;
  redis: RedisConfig;
  logsShared: LogsSharedConfig;
  logsQuery: LogsQueryConfig;
  activityLog: ActivityLogIngestConfig;
  errorLog: ErrorLogIngestConfig;
};
