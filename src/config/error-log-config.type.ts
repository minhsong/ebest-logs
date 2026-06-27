export type ErrorLogIngestConfig = {
  redisStream: string;
  consumerGroup: string;
  consumerName: string;
  streamMaxLen: number;
  deadLetterStream: string;
  retentionDays: number;
  maxIngestRetries: number;
  ingestMode: 'redis' | 'file';
  fileIngestPath: string;
};
