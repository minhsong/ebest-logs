import {
  validateErrorIngestPayload,
  type ErrorEventPublishPayload,
} from '@ebest/error-log-types';
import type { ErrorEventRepository } from '#src/error-log/events/error-event.repository';
import type { RedisService } from '#src/redis/redis.service';
import type { ErrorLogIngestConfig } from '#src/config/error-log-config.type';

export async function persistErrorPayloadJson(
  raw: string,
  eventRepository: ErrorEventRepository,
  maxRetries: number,
): Promise<void> {
  const parsed = JSON.parse(raw) as unknown;
  const validation = validateErrorIngestPayload(parsed);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }
  await eventRepository.persistPayload(
    validation.payload as ErrorEventPublishPayload,
    maxRetries,
  );
}

export async function ingestErrorStreamMessage(input: {
  id: string;
  message: Record<string, string>;
  cfg: ErrorLogIngestConfig;
  redisService: RedisService;
  eventRepository: ErrorEventRepository;
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
    await persistErrorPayloadJson(raw, eventRepository, maxRetries);
    await redisService.xAck(cfg.redisStream, cfg.consumerGroup, id);
  } catch (lastError) {
    logger.error(
      `Failed to ingest error message ${id}: ${
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
