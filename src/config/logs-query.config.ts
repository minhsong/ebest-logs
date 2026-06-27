import { registerAs } from '@nestjs/config';
import type { LogsQueryConfig } from './logs-query-config.type';

export default registerAs<LogsQueryConfig>('logsQuery', () => ({
  cacheEnabled: process.env.LOGS_QUERY_CACHE_ENABLED !== 'false',
  cacheTtlSec: parseInt(process.env.LOGS_QUERY_CACHE_TTL_SEC || '20', 10),
  cacheSkipWhenQ: process.env.LOGS_QUERY_CACHE_SKIP_Q !== 'false',
}));
