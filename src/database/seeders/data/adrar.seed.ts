/**
 * §8.3 — Seed data: Wilaya of Adrar and its communes.
 *
 * Adrar is wilaya code 01 (officially code 01 / 1 in Algerian nomenclature).
 * GPS coordinates are centroid points for each commune, sourced from
 * official Algerian geographic data. They are used by the Haversine distance
 * formula (§8.1) to calculate delivery distances between communes.
 *
 * Only the communes present here are supported in Phase 1 (§12).
 * Additional wilayas / communes can be appended in future phases.
 */

export interface CommuneSeedData {
  nameLatin: string;
  nameArabic: string;
  lat: number;
  lng: number;
}

export interface WilayaSeedData {
  id: number;
  nameLatin: string;
  nameArabic: string;
  code: number;
  communes: CommuneSeedData[];
}

export const ADRAR_WILAYA: WilayaSeedData = {
  id: 1,
  nameLatin: 'Adrar',
  nameArabic: 'أدرار',
  code: 1,
  communes: [
    // ── Major administrative centre ──────────────────────────────────────
    {
      nameLatin: 'Adrar',
      nameArabic: 'أدرار',
      lat: 27.874100,
      lng: -0.291800,
    },
    // ── Major communes (north → south) ──────────────────────────────────
    {
      nameLatin: 'Timimoun',
      nameArabic: 'تيميمون',
      lat: 29.263800,
      lng: 0.230800,
    },
    {
      nameLatin: 'Charouine',
      nameArabic: 'شروين',
      lat: 29.016700,
      lng: 0.266700,
    },
    {
      nameLatin: 'Tinerkouk',
      nameArabic: 'تينركوك',
      lat: 29.033300,
      lng: 0.283300,
    },
    {
      nameLatin: 'Aougrout',
      nameArabic: 'أوقروت',
      lat: 28.866700,
      lng: 0.433300,
    },
    {
      nameLatin: 'Tsabit',
      nameArabic: 'تسابيت',
      lat: 28.350000,
      lng: -0.016700,
    },
    {
      nameLatin: 'Metarfa',
      nameArabic: 'معطرفة',
      lat: 28.016700,
      lng: -0.350000,
    },
    {
      nameLatin: 'Fenoughil',
      nameArabic: 'فنوغيل',
      lat: 27.683300,
      lng: -0.483300,
    },
    {
      nameLatin: 'Bouda',
      nameArabic: 'بودة',
      lat: 27.750000,
      lng: -0.350000,
    },
    {
      nameLatin: 'Zaouiet Kounta',
      nameArabic: 'زاوية كنتة',
      lat: 27.233300,
      lng: -0.183300,
    },
    {
      nameLatin: 'Sali',
      nameArabic: 'صالي',
      lat: 27.350000,
      lng: -0.583300,
    },
    {
      nameLatin: 'Sbaa',
      nameArabic: 'سبعة',
      lat: 27.616700,
      lng: 0.150000,
    },
    {
      nameLatin: 'Ouled Ahmed Timmi',
      nameArabic: 'أولاد أحمد تيمي',
      lat: 27.083300,
      lng: 0.233300,
    },
    {
      nameLatin: 'Reggane',
      nameArabic: 'رقان',
      lat: 26.713300,
      lng: 0.166700,
    },
    {
      nameLatin: 'Aoulef',
      nameArabic: 'أولف',
      lat: 26.968700,
      lng: 1.081300,
    },
    {
      nameLatin: 'Talmine',
      nameArabic: 'تالمين',
      lat: 26.366700,
      lng: 0.933300,
    },
    {
      nameLatin: 'Akabli',
      nameArabic: 'أكابلي',
      lat: 26.700000,
      lng: 1.366700,
    },
    {
      nameLatin: 'In Zghmir',
      nameArabic: 'إن زغمير',
      lat: 27.016700,
      lng: 1.283300,
    },
    {
      nameLatin: 'Deldoul',
      nameArabic: 'دلدول',
      lat: 28.683300,
      lng: 0.333300,
    },
    {
      nameLatin: 'Ksar Kaddour',
      nameArabic: 'قصر قدور',
      lat: 27.566700,
      lng: -0.433300,
    },
  ],
};

/** All wilayas to seed — extend this array to add future wilaya support. */
export const WILAYAS_TO_SEED: WilayaSeedData[] = [ADRAR_WILAYA];
