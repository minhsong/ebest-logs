import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'ebest-logs',
      status: 'ok',
    };
  }
}
