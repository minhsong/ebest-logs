import {
  buildActivityEventKey,
  validateActivityIngestPayload,
  type ActivityEventPublishPayload,
} from '@ebest/activity-log-contract';
import type { ActivityEventRepository } from '#src/events/activity-event.repository';
import type { RedisService } from '#src/redis/redis.service';
import type { ActivityLogIngestConfig } from '#src/config/activity-log-config.type';

export async function persistActivityPayloadJson(
  raw: string,
  eventRepository: ActivityEventRepository,
  maxRetries: number,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const validation = validateActivityIngestPayload(parsed);
      if (!validation.ok) {
        throw new Error(validation.reason);
      }

      const payload = validation.payload as ActivityEventPublishPayload;
      const eventKey = buildActivityEventKey(payload);
      const doc = eventRepository.buildDocument(payload, eventKey);
      await eventRepository.upsertByEventKey(eventKey, doc);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await sleep(200 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function ingestActivityStreamMessage(input: {
  id: string;
  message: Record<string, string>;
  cfg: ActivityLogIngestConfig;
  redisService: RedisService;
  eventRepository: ActivityEventRepository;
  maxRetries: number;
  logger: { error: (msg: string) => void };
}): Promise<void> {
  const { id, message, cfg, redisService, eventRepository, maxRetries, logger } =
    input;
  const raw = message.payload;

  if (!raw) {
    await redisService.xAck(cfg.redisStream, cfg.consumerGroup, id);
    return;
  }

  try {
    await persistActivityPayloadJson(raw, eventRepository, maxRetries);
    await redisService.xAck(cfg.redisStream, cfg.consumerGroup, id);
  } catch (lastError) {
    logger.error(
      `Failed to ingest message ${id} after ${maxRetries} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
    await redisService.xAddAbsolute(
      cfg.deadLetterStream,
      {
        payload: raw,
        sourceId: id,
        error: String(lastError),
        attempts: String(maxRetries),
      },
      cfg.streamMaxLen,
    );
    await redisService.xAck(cfg.redisStream, cfg.consumerGroup, id);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
