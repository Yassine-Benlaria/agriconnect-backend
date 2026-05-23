import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Logger ───────────────────────────────────────────────────────────────
  app.use(morgan('dev'));

  // ── Static files — serve uploads/ for product images ────────────────────
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // ── Global Validation Pipe (§11 — Input validation via class-validator) ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global Exception Filter (§11 — Consistent error response shape) ──────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
