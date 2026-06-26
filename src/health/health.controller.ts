import { Controller, Get, Optional } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import type { AllConfigType } from '#src/config/config.type';
import { RedisService } from '#src/redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly redisService: RedisService,
    @Optional() @InjectConnection() private readonly mongoConnection?: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'MongoDB + Redis status' })
  async check() {
    const mongoCfg = this.configService.get('mongo', { infer: true });
    let mongo: { status: string } = { status: 'unknown' };
    if (!mongoCfg?.enabled) {
      mongo = { status: 'disabled' };
    } else if (!this.mongoConnection) {
      mongo = { status: 'unavailable' };
    } else {
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      const rs = this.mongoConnection.readyState;
      mongo = { status: states[rs] ?? String(rs) };
    }
    const ping = await this.redisService.ping();
    return {
      status: 'ok',
      service: 'ebest-activity-log',
      mongo,
      redis:
        ping === 'DISABLED'
          ? { status: 'disabled' }
          : {
              status: ping === 'PONG' ? 'up' : 'down',
              ping,
              connected: this.redisService.isConnected(),
            },
    };
  }
}
