import { registerAs } from '@nestjs/config';
import type { LogsSharedConfig } from './logs-shared-config.type';

export default registerAs<LogsSharedConfig>('logsShared', () => ({
  internalApiKey:
    process.env.LOGS_INTERNAL_API_KEY?.trim() ||
    process.env.INTERNAL_API_KEY?.trim() ||
    process.env.ACTIVITY_LOG_INTERNAL_API_KEY?.trim() ||
    '',
}));
