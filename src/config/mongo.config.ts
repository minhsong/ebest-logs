import { registerAs } from '@nestjs/config';
import type { MongoConfig } from './mongo-config.type';

export default registerAs<MongoConfig>('mongo', () => ({
  uri:
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/ebest_activity_log',
  enabled: process.env.MONGODB_ENABLED !== 'false',
}));
