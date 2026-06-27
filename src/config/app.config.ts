import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from '#src/utils/validate-config';
import type { AppConfig } from './app-config.type';

class EnvValidator {
  @IsString()
  @IsOptional()
  NODE_ENV?: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  APP_PORT?: number;

  @IsString()
  @IsOptional()
  API_PREFIX?: string;

  @IsString()
  @IsOptional()
  APP_NAME?: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvValidator);
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'ebest-logs',
    port: process.env.APP_PORT
      ? parseInt(process.env.APP_PORT, 10)
      : process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : 3010,
    apiPrefix: process.env.API_PREFIX || 'api',
  };
});
