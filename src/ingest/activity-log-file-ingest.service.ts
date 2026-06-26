import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { open, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { AllConfigType } from '#src/config/config.type';
import { ActivityEventRepository } from '#src/events/activity-event.repository';
import { persistActivityPayloadJson } from './activity-stream-ingest.handler';

/**
 * Dev ingest: đọc file JSONL do CRM publish (ACTIVITY_LOG_PUBLISH_MODE=file).
 * Prod dùng Redis stream ingest.
 */
@Injectable()
export class ActivityLogFileIngestService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ActivityLogFileIngestService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private offset = 0;
  private partialLine = '';
  private filePath = '';

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly eventRepository: ActivityEventRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const mongo = this.configService.get('mongo', { infer: true });
    if (!mongo?.enabled) {
      return;
    }

    const cfg = this.configService.getOrThrow('activityLog', { infer: true });
    if (cfg.ingestMode !== 'file' || !cfg.fileIngestPath?.trim()) {
      return;
    }

    this.filePath = resolve(cfg.fileIngestPath.trim());
    await this.loadOffset();
    this.timer = setInterval(() => {
      void this.pollFile().catch((error) => {
        this.logger.warn(
          `File ingest poll error: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }, 1500);

    this.logger.log(`File ingest started — path=${this.filePath}`);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private offsetSidecarPath(): string {
    return `${this.filePath}.offset`;
  }

  private async loadOffset(): Promise<void> {
    try {
      const raw = await readFile(this.offsetSidecarPath(), 'utf8');
      const n = parseInt(raw.trim(), 10);
      if (Number.isFinite(n) && n >= 0) {
        this.offset = n;
      }
    } catch {
      this.offset = 0;
    }
  }

  private async saveOffset(): Promise<void> {
    const { writeFile, mkdir } = await import('node:fs/promises');
    await mkdir(dirname(this.offsetSidecarPath()), { recursive: true });
    await writeFile(this.offsetSidecarPath(), String(this.offset), 'utf8');
  }

  private async pollFile(): Promise<void> {
    const fileStat = await stat(this.filePath).catch(() => null);
    if (!fileStat) {
      return;
    }

    if (fileStat.size < this.offset) {
      this.offset = 0;
      this.partialLine = '';
    }

    const toRead = fileStat.size - this.offset;
    if (toRead <= 0) {
      return;
    }

    const handle = await open(this.filePath, 'r');
    try {
      const buffer = Buffer.alloc(toRead);
      await handle.read(buffer, 0, toRead, this.offset);
      this.offset = fileStat.size;
      await this.saveOffset();

      const chunk = this.partialLine + buffer.toString('utf8');
      const lines = chunk.split('\n');
      this.partialLine = lines.pop() ?? '';

      const cfg = this.configService.getOrThrow('activityLog', { infer: true });

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        try {
          await persistActivityPayloadJson(
            trimmed,
            this.eventRepository,
            cfg.maxIngestRetries,
          );
        } catch (error) {
          this.logger.warn(
            `File ingest line failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } finally {
      await handle.close();
    }
  }
}
