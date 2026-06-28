import { registerAs } from '@nestjs/config';
import type { LogsSharedConfig } from './logs-shared-config.type';

/** Kết nối nội bộ CRM/Gateway → query API — khớp LOGS_INTERNAL_API_KEY trên CRM. */
export default registerAs<LogsSharedConfig>('logsShared', () => ({
  internalApiKey: process.env.LOGS_INTERNAL_API_KEY?.trim() || '',
}));
