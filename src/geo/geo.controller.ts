import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GeoService } from './geo.service';
import { Wilaya } from './entities/wilaya.entity';
import { Commune } from './entities/commune.entity';

/**
 * Public geo-lookup endpoints — no authentication required.
 * Used by the registration and order-creation flows to populate
 * wilaya/commune dropdowns on the client.
 */
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  /**
   * GET /api/geo/wilayas
   * Returns all 58 wilayas ordered by official code.
   */
  @Get('wilayas')
  findAllWilayas(): Promise<Wilaya[]> {
    return this.geoService.findAllWilayas();
  }

  /**
   * GET /api/geo/wilayas/:wilayaId/communes
   * Returns all communes for a given wilaya, ordered A–Z by Latin name.
   * 404 if the wilayaId does not exist.
   */
  @Get('wilayas/:wilayaId/communes')
  findCommunesByWilaya(
    @Param('wilayaId', ParseIntPipe) wilayaId: number,
  ): Promise<Commune[]> {
    return this.geoService.findCommunesByWilaya(wilayaId);
  }
}
