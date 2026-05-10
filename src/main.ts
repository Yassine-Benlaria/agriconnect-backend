import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Global Validation Pipe (§11 — Input validation via class-validator) ──
  // whitelist:     strips unknown properties from incoming DTOs
  // forbidNonWhitelisted: rejects requests with extra properties
  // transform:     auto-converts plain objects to DTO class instances & casts
  //                primitive types (e.g. query param strings → numbers)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Exception Filter (§11 — Consistent error response shape) ──────
  // Ensures every error — HttpException or unexpected — returns:
  //   { statusCode, message, error }
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── CORS (permissive for development, restrict in production) ────────────
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 AgriConnect API running on: http://localhost:${port}/api`);
}

bootstrap();
