import type { RedisService } from '#src/redis/redis.service';

export type RedisStreamMessage = { id: string; message: Record<string, string> };

/** Generic Redis Stream consumer loop — dùng chung activity + error ingest. */
export async function runRedisStreamConsumerLoop(input: {
  running: () => boolean;
  redisService: RedisService;
  stream: string;
  group: string;
  consumer: string;
  batchSize: number;
  blockMs: number;
  onMessage: (item: RedisStreamMessage) => Promise<void>;
  onLoopError: (error: unknown) => void;
}): Promise<void> {
  while (input.running()) {
    try {
      const batch = await input.redisService.xReadGroup(
        input.group,
        input.consumer,
        input.stream,
        input.batchSize,
        input.blockMs,
      );
      if (!batch?.length) {
        continue;
      }
      for (const item of batch) {
        await input.onMessage(item);
      }
    } catch (error) {
      input.onLoopError(error);
      await sleep(1000);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
