export type ActivityLogIngestConfig = {
  redisStream: string;
  consumerGroup: string;
  consumerName: string;
  streamMaxLen: number;
  deadLetterStream: string;
  retentionDays: number;
  internalApiKey: string;
  maxIngestRetries: number;
  /** redis = XREADGROUP; file = tail JSONL từ CRM publish */
  ingestMode: 'redis' | 'file';
  fileIngestPath: string;
};
