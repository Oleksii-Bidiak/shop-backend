import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { SWAGGER_EXTRA_MODELS } from './common/swagger/swagger.models.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');
  app.use(helmet());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Shop Backend API')
    .setDescription('API for product catalogue, inventory, and orders')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: SWAGGER_EXTRA_MODELS,
  });
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.getOrThrow<number>('app.port');
  await app.listen(port);
}
bootstrap();
