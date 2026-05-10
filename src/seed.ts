/**
 * Standalone NestJS seed script.
 *
 * Bootstraps only the SeederModule (no HTTP server, no full AppModule)
 * and calls SeederService.seed(), then exits cleanly.
 *
 * Run with:
 *   npm run seed
 *
 * Prerequisites:
 *   1. PostgreSQL container must be running  →  docker-compose up -d
 *   2. .env file must be present with valid DB credentials
 */
import { NestFactory } from '@nestjs/core';
import { SeederModule } from './database/seeders/seeder.module';
import { SeederService } from './database/seeders/seeder.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeederModule, {
    // Suppress the NestJS banner in seeder output for cleaner logs
    logger: ['log', 'warn', 'error'],
  });

  const seeder = app.get(SeederService);

  try {
    await seeder.seed();
    console.log('\n✅  Seeding completed successfully.\n');
  } catch (error) {
    console.error('\n❌  Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
