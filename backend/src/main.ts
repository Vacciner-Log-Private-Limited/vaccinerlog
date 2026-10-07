import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // All routes are served under /api
  app.setGlobalPrefix('api');

  // Validate + strip unknown fields on every incoming request body
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow the Next.js frontend to call this API from the browser
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000',
    credentials: true,
  });

  // Interactive API docs at /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vacciner Log API')
    .setDescription('Backend API for the Vacciner Log application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 API running on http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger docs on http://localhost:${port}/docs`);
}
bootstrap();
