import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AllConfigType } from '#src/config/config.type';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected =
      this.configService.get('activityLog', { infer: true })?.internalApiKey ??
      '';
    if (!expected) {
      throw new UnauthorizedException('INTERNAL_API_KEY is not configured');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.header('x-internal-api-key')?.trim() ?? '';
    if (!key || key !== expected) {
      throw new UnauthorizedException('Invalid internal API key');
    }
    return true;
  }
}
