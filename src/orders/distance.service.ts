import { Injectable } from '@nestjs/common';
import { Commune } from '../geo/entities/commune.entity';

/**
 * Implements the geographic distance calculation (§8.1) and delivery pricing
 * formula (§8.2) for AgriConnect.
 *
 * Keeping these as pure, injectable functions makes them trivially unit-testable
 * and easy to swap for a configurable pricing model in a future admin panel.
 */
@Injectable()
export class DistanceService {
  private readonly EARTH_RADIUS_KM = 6371;

  // ── §8.1 — Haversine formula ──────────────────────────────────────────────

  /**
   * Calculates the great-circle distance between two commune centroids.
   *
   * a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
   * c = 2 × atan2(√a, √(1−a))
   * distance = R × c     (R = 6371 km)
   *
   * @returns Distance in kilometres, rounded to 2 decimal places.
   */
  calculateDistance(from: Commune, to: Commune): number {
    const lat1 = this.toRad(Number(from.lat));
    const lat2 = this.toRad(Number(to.lat));
    const dLat = this.toRad(Number(to.lat) - Number(from.lat));
    const dLng = this.toRad(Number(to.lng) - Number(from.lng));

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = this.EARTH_RADIUS_KM * c;

    return Math.round(distanceKm * 100) / 100;
  }

  // ── §8.2 — Delivery pricing ───────────────────────────────────────────────

  /**
   * Calculates delivery fee in Algerian Dinar (DZD) given a distance.
   *
   * | Range      | Formula                              |
   * |------------|--------------------------------------|
   * | 0–10 km    | 200 DZD (flat base fee)              |
   * | 10–30 km   | 200 + (distance − 10) × 20 DZD       |
   * | 30+ km     | 600 + (distance − 30) × 15 DZD       |
   *
   * The result is rounded up to the nearest whole DZD.
   * This formula is configurable per §8.2 — should move to admin settings later.
   *
   * @returns Delivery price in DZD, rounded up to nearest integer.
   */
  calculateDeliveryPrice(distanceKm: number): number {
    let price: number;

    if (distanceKm <= 10) {
      price = 200;
    } else if (distanceKm <= 30) {
      price = 200 + (distanceKm - 10) * 20;
    } else {
      price = 600 + (distanceKm - 30) * 15;
    }

    return Math.ceil(price);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
