export type ActivityLogIngestConfig = {
  redisStream: string;
  consumerGroup: string;
  consumerName: string;
  consumerBatchSize: number;
  consumerBlockMs: number;
  streamMaxLen: number;
  deadLetterStream: string;
  retentionDays: number;
  maxIngestRetries: number;
  /** redis = XREADGROUP; file = tail JSONL từ CRM publish */
  ingestMode: 'redis' | 'file';
  fileIngestPath: string;
};
