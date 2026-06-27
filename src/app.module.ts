import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { AllConfigType } from '#src/config/config.type';
import appConfig from '#src/config/app.config';
import mongoConfig from '#src/config/mongo.config';
import redisConfig from '#src/config/redis.config';
import activityLogConfig from '#src/config/activity-log.config';
import errorLogConfig from '#src/config/error-log.config';
import logsSharedConfig from '#src/config/logs-shared.config';
import { RedisModule } from '#src/redis/redis.module';
import { EventsModule } from '#src/events/events.module';
import { QueryModule } from '#src/query/query.module';
import { ErrorLogModule } from '#src/error-log/error-log.module';
import { HealthModule } from '#src/health/health.module';
import { AppController } from '#src/app.controller';

const mongoEnabled = process.env.MONGODB_ENABLED !== 'false';

const mongoImports = mongoEnabled
  ? [
      MongooseModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService<AllConfigType>) => ({
          uri: config.get('mongo', { infer: true })!.uri,
        }),
      }),
      EventsModule,
      QueryModule,
      ErrorLogModule,
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        mongoConfig,
        redisConfig,
        logsSharedConfig,
        activityLogConfig,
        errorLogConfig,
      ],
      envFilePath: ['.env.local', '.env'],
    }),
    ...mongoImports,
    RedisModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
