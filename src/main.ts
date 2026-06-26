import 'dotenv/config';
import 'tsconfig-paths/register';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { AllConfigType } from '#src/config/config.type';
import { AppModule } from '#src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AllConfigType>);
  const appConfig = config.get('app', { infer: true });
  const prefix = `${appConfig?.apiPrefix ?? 'api'}/v1`;
  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (appConfig?.nodeEnv !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('Ebest Activity Log')
      .setDescription('Business activity log — ingest + internal query')
      .setVersion('0.1.0')
      .addApiKey(
        { type: 'apiKey', name: 'X-Internal-Api-Key', in: 'header' },
        'internal-api-key',
      )
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
  }

  const port = appConfig?.port ?? 3010;
  await app.listen(port, '127.0.0.1');
  console.log(
    `ebest-activity-log listening on http://127.0.0.1:${port}/${prefix}/`,
  );
}

void bootstrap();
