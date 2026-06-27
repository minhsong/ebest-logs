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
import { ErrorEventRepository } from '#src/error-log/events/error-event.repository';
import { persistErrorPayloadJson } from './error-stream-ingest.handler';

/** Dev ingest: JSONL do CRM/Gateway publish (ERROR_LOG_PUBLISH_MODE=file). */
@Injectable()
export class ErrorLogFileIngestService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ErrorLogFileIngestService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private offset = 0;
  private partialLine = '';
  private filePath = '';

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly eventRepository: ErrorEventRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const mongo = this.configService.get('mongo', { infer: true });
    if (!mongo?.enabled) {
      return;
    }

    const cfg = this.configService.getOrThrow('errorLog', { infer: true });
    if (cfg.ingestMode !== 'file' || !cfg.fileIngestPath?.trim()) {
      return;
    }

    this.filePath = resolve(cfg.fileIngestPath.trim());
    await this.loadOffset();
    this.timer = setInterval(() => {
      void this.pollFile().catch((error) => {
        this.logger.warn(
          `Error file ingest poll: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }, 1500);

    this.logger.log(`Error file ingest started — path=${this.filePath}`);
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

      const cfg = this.configService.getOrThrow('errorLog', { infer: true });

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        try {
          await persistErrorPayloadJson(
            trimmed,
            this.eventRepository,
            cfg.maxIngestRetries,
          );
        } catch (error) {
          this.logger.warn(
            `Error file ingest line failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } finally {
      await handle.close();
    }
  }
}
