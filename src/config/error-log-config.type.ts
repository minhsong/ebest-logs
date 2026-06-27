export type ErrorLogIngestConfig = {
  redisStream: string;
  consumerGroup: string;
  consumerName: string;
  consumerBatchSize: number;
  consumerBlockMs: number;
  streamMaxLen: number;
  deadLetterStream: string;
  retentionDays: number;
  maxIngestRetries: number;
  ingestMode: 'redis' | 'file';
  fileIngestPath: string;
};
