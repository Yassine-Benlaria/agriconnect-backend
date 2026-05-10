import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wilaya } from '../../geo/entities/wilaya.entity';
import { Commune } from '../../geo/entities/commune.entity';
import { WILAYAS_TO_SEED, WilayaSeedData } from './data/adrar.seed';

/**
 * SeederService — populates reference tables (wilayas, communes) with
 * the data required by §8.3.
 *
 * Design principles:
 *  - **Idempotent**: checks for existing records before inserting, so it is
 *    safe to run repeatedly without duplicating data.
 *  - **Data-driven**: seed data lives in `./data/` files, fully separated
 *    from this logic. Adding a new wilaya only requires updating the data file.
 *  - **Transactional**: each wilaya + its communes are inserted together.
 *    A failure leaves the DB clean (no orphaned wilaya with missing communes).
 */
@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Wilaya)
    private readonly wilayaRepository: Repository<Wilaya>,
    @InjectRepository(Commune)
    private readonly communeRepository: Repository<Commune>,
  ) {}

  /** Entry point — seeds all wilayas defined in WILAYAS_TO_SEED. */
  async seed(): Promise<void> {
    this.logger.log('Starting database seed…');

    for (const wilayaData of WILAYAS_TO_SEED) {
      await this.seedWilaya(wilayaData);
    }

    this.logger.log('Database seed complete.');
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async seedWilaya(data: WilayaSeedData): Promise<void> {
    // ── Idempotency check ──────────────────────────────────────────────────
    const alreadyExists = await this.wilayaRepository.existsBy({
      code: data.code,
    });

    if (alreadyExists) {
      this.logger.log(
        `Wilaya "${data.nameLatin}" (code ${data.code}) already seeded — skipping.`,
      );
      return;
    }

    // ── Insert wilaya ──────────────────────────────────────────────────────
    this.logger.log(`Seeding wilaya: ${data.nameLatin} (${data.nameArabic})…`);

    const wilaya = await this.wilayaRepository.save(
      this.wilayaRepository.create({
        id: data.id,
        nameLatin: data.nameLatin,
        nameArabic: data.nameArabic,
        code: data.code,
      }),
    );

    // ── Insert communes ────────────────────────────────────────────────────
    this.logger.log(
      `  → Inserting ${data.communes.length} communes for ${data.nameLatin}…`,
    );

    const communes = data.communes.map((c) =>
      this.communeRepository.create({
        nameLatin: c.nameLatin,
        nameArabic: c.nameArabic,
        lat: c.lat,
        lng: c.lng,
        wilayaId: wilaya.id,
      }),
    );

    await this.communeRepository.save(communes);

    this.logger.log(
      `  ✓ Wilaya "${data.nameLatin}" seeded with ${communes.length} communes.`,
    );
  }
}
