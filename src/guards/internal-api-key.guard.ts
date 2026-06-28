import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AllConfigType } from '#src/config/config.type';

const HEADER = 'x-internal-api-key';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected =
      this.configService.get('logsShared', { infer: true })?.internalApiKey ||
      '';
    if (!expected) {
      throw new UnauthorizedException(
        'LOGS_INTERNAL_API_KEY is not configured',
      );
    }
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.header(HEADER)?.trim() ?? '';
    if (!key || key !== expected) {
      throw new UnauthorizedException('Invalid internal API key');
    }
    return true;
  }
}
