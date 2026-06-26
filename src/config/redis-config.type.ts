export type RedisConfig = {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  connectTimeout: number;
  commandTimeout: number;
  retryStrategy: boolean;
  maxRetries: number;
  enabled: boolean;
};
