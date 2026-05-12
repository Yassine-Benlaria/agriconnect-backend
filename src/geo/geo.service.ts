import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wilaya } from './entities/wilaya.entity';
import { Commune } from './entities/commune.entity';

@Injectable()
export class GeoService {
  constructor(
    @InjectRepository(Wilaya)
    private readonly wilayaRepo: Repository<Wilaya>,
    @InjectRepository(Commune)
    private readonly communeRepo: Repository<Commune>,
  ) {}

  /** Returns all 58 wilayas ordered by official code. */
  findAllWilayas(): Promise<Wilaya[]> {
    return this.wilayaRepo.find({ order: { code: 'ASC' } });
  }

  /** Returns all communes belonging to a given wilaya, ordered alphabetically. */
  async findCommunesByWilaya(wilayaId: number): Promise<Commune[]> {
    const wilaya = await this.wilayaRepo.findOne({ where: { id: wilayaId } });
    if (!wilaya) throw new NotFoundException('Wilaya not found');
    return await this.communeRepo.find({
      where: { wilayaId },
      order: { nameLatin: 'ASC' },
    });
  }
}
