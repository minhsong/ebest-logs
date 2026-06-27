import { Global, Module } from '@nestjs/common';
import { LogsQueryCacheService } from './logs-query-cache.service';

@Global()
@Module({
  providers: [LogsQueryCacheService],
  exports: [LogsQueryCacheService],
})
export class LogsQueryModule {}
