// ============================================================
// stores.ts - IIC 매장 정적 데이터
// 실제 운영 데이터를 연동하기 전까지 사용하는 샘플 데이터입니다.
// 비전공자 설명: 실제 서버나 데이터베이스가 없을 때
// 앱이 보여줄 가짜 데이터(목업)를 미리 만들어둔 파일입니다.
// ============================================================

import { Store, BrandDefinition } from '../../types';

// ----------------------------------------------------------
// IIC 계열 브랜드 매장 데이터
// ----------------------------------------------------------
export const IIC_STORES: Store[] = [
  // ── Gentle Monster ──────────────────────────────────────
  {
    id: 'gm-seoul-garosu',
    name: 'Gentle Monster Garosu-gil',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      city: 'Seoul',
      country: 'South Korea',
      lat: 37.5197,
      lng: 127.0215,
    },
    status: 'Open',
    brandCategory: 'iic',
    openDate: '2018-03-15',
    area: 280,
    contract: {
      startDate: '2018-03-01',
      endDate: '2026-02-28',
      renewalOption: true,
    },
    financial: {
      monthlyRent: 45000000,
      currency: 'KRW',
      monthlySales: 320000000,
      salesPerSqm: 1142857,
      investment: 2800000000,
      deposit: 500000000,
      rentType: 'fixed',
      yearlySales: [
        { year: 2023, amount: 3650000000 },
        { year: 2024, amount: 3900000000 },
        { year: 2025, amount: 4100000000 },
      ],
    },
  },
  {
    id: 'gm-tokyo-omotesando',
    name: 'Gentle Monster Omotesando',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      city: 'Tokyo',
      country: 'Japan',
      lat: 35.6650,
      lng: 139.7073,
    },
    status: 'Open',
    brandCategory: 'iic',
    openDate: '2020-11-20',
    area: 320,
    financial: {
      monthlyRent: 8500000,
      currency: 'JPY',
      monthlySales: 45000000,
      salesPerSqm: 140625,
      investment: 580000000,
      yearlySales: [
        { year: 2023, amount: 520000000 },
        { year: 2024, amount: 560000000 },
        { year: 2025, amount: 590000000 },
      ],
    },
  },
  {
    id: 'gm-shanghai-xintiandi',
    name: 'Gentle Monster Xintiandi',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      city: 'Shanghai',
      country: 'China',
      lat: 31.2197,
      lng: 121.4698,
    },
    status: 'Open',
    brandCategory: 'iic',
    openDate: '2019-06-01',
    area: 450,
    financial: {
      monthlyRent: 850000,
      currency: 'CNY',
      monthlySales: 4200000,
      salesPerSqm: 9333,
      investment: 38000000,
      yearlySales: [
        { year: 2023, amount: 48000000 },
        { year: 2024, amount: 52000000 },
        { year: 2025, amount: 55000000 },
      ],
    },
  },
  {
    id: 'gm-ny-soho',
    name: 'Gentle Monster SoHo',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      city: 'New York',
      country: 'USA',
      lat: 40.7231,
      lng: -74.0006,
    },
    status: 'Open',
    brandCategory: 'iic',
    openDate: '2021-09-15',
    area: 380,
    financial: {
      monthlyRent: 180000,
      currency: 'USD',
      monthlySales: 950000,
      salesPerSqm: 2500,
      investment: 8500000,
      yearlySales: [
        { year: 2023, amount: 10800000 },
        { year: 2024, amount: 11500000 },
        { year: 2025, amount: 12200000 },
      ],
    },
  },
  {
    id: 'gm-paris-marais',
    name: 'Gentle Monster Le Marais',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      city: 'Paris',
      country: 'France',
      lat: 48.8566,
      lng: 2.3554,
    },
    status: 'Open',
    brandCategory: 'iic',
    openDate: '2022-04-20',
    area: 310,
    financial: {
      monthlyRent: 65000,
      currency: 'EUR',
      monthlySales: 380000,
      salesPerSqm: 1226,
      investment: 3200000,
      yearlySales: [
        { year: 2023, amount: 4200000 },
        { year: 2024, amount: 4600000 },
        { year: 2025, amount: 4900000 },
      ],
    },
  },
  // ── Pipeline (예정/진행 중) ──────────────────────────────
  {
    id: 'gm-dubai-mall',
    name: 'Gentle Monster Dubai Mall',
    brand: 'Gentle Monster',
    type: 'Mall',
    location: {
      city: 'Dubai',
      country: 'UAE',
      lat: 25.1984,
      lng: 55.2796,
    },
    status: 'Construction',
    statusYear: 2025,
    brandCategory: 'iic',
    openDate: '2026-03-01',
    area: 420,
    financial: {
      monthlyRent: 180000,
      currency: 'AED',
      monthlySales: 0,
      salesPerSqm: 0,
      investment: 5800000,
      estimatedSales: 950000,
      estimatedMargin: 28,
    },
  },
  {
    id: 'gm-london-covent',
    name: 'Gentle Monster Covent Garden',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      city: 'London',
      country: 'UK',
      lat: 51.5117,
      lng: -0.1238,
    },
    status: 'Signed',
    statusYear: 2025,
    brandCategory: 'iic',
    openDate: '2025-12-01',
    area: 290,
    financial: {
      monthlyRent: 55000,
      currency: 'GBP',
      monthlySales: 0,
      salesPerSqm: 0,
      investment: 2900000,
      estimatedSales: 480000,
      estimatedMargin: 25,
    },
  },
  {
    id: 'gm-singapore-orchard',
    name: 'Gentle Monster ION Orchard',
    brand: 'Gentle Monster',
    type: 'Mall',
    location: {
      city: 'Singapore',
      country: 'Singapore',
      lat: 1.3040,
      lng: 103.8318,
    },
    status: 'Confirmed',
    statusYear: 2025,
    brandCategory: 'iic',
    openDate: '2026-06-01',
    area: 350,
    financial: {
      monthlyRent: 95000,
      currency: 'SGD',
      monthlySales: 0,
      salesPerSqm: 0,
      investment: 3800000,
      estimatedSales: 650000,
      estimatedMargin: 26,
    },
  },
  {
    id: 'gm-sydney-pitt',
    name: 'Gentle Monster Sydney CBD',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      city: 'Sydney',
      country: 'Australia',
      lat: -33.8688,
      lng: 151.2093,
    },
    status: 'Planned',
    statusYear: 2025,
    brandCategory: 'iic',
    openDate: '2026-09-01',
    area: 260,
    financial: {
      monthlyRent: 75000,
      currency: 'AUD',
      monthlySales: 0,
      salesPerSqm: 0,
      investment: 2600000,
      estimatedSales: 380000,
      estimatedMargin: 22,
    },
  },
  // ── Tamburins ───────────────────────────────────────────
  {
    id: 'tb-seoul-hannam',
    name: 'Tamburins Hannam',
    brand: 'Tamburins',
    type: 'FS',
    location: {
      city: 'Seoul',
      country: 'South Korea',
      lat: 37.5340,
      lng: 127.0025,
    },
    status: 'Open',
    brandCategory: 'iic',
    openDate: '2021-05-10',
    area: 180,
    financial: {
      monthlyRent: 28000000,
      currency: 'KRW',
      monthlySales: 180000000,
      salesPerSqm: 1000000,
      investment: 1500000000,
      yearlySales: [
        { year: 2023, amount: 2100000000 },
        { year: 2024, amount: 2300000000 },
        { year: 2025, amount: 2500000000 },
      ],
    },
  },
  {
    id: 'tb-tokyo-shibuya',
    name: 'Tamburins Shibuya',
    brand: 'Tamburins',
    type: 'FS',
    location: {
      city: 'Tokyo',
      country: 'Japan',
      lat: 35.6598,
      lng: 139.7004,
    },
    status: 'Open',
    brandCategory: 'iic',
    openDate: '2022-08-20',
    area: 210,
    financial: {
      monthlyRent: 5800000,
      currency: 'JPY',
      monthlySales: 32000000,
      salesPerSqm: 152381,
      investment: 380000000,
      yearlySales: [
        { year: 2023, amount: 370000000 },
        { year: 2024, amount: 400000000 },
        { year: 2025, amount: 425000000 },
      ],
    },
  },
  {
    id: 'tb-hk-central',
    name: 'Tamburins Central',
    brand: 'Tamburins',
    type: 'FS',
    location: {
      city: 'Hong Kong',
      country: 'China',
      lat: 22.2796,
      lng: 114.1618,
    },
    status: 'Signed',
    statusYear: 2025,
    brandCategory: 'iic',
    openDate: '2025-11-01',
    area: 200,
    financial: {
      monthlyRent: 350000,
      currency: 'HKD',
      monthlySales: 0,
      salesPerSqm: 0,
      investment: 8000000,
      estimatedSales: 1800000,
      estimatedMargin: 30,
    },
  },
  // ── Nudake ──────────────────────────────────────────────
  {
    id: 'nd-seoul-seongsu',
    name: 'Nudake Seongsu',
    brand: 'Nudake',
    type: 'FS',
    location: {
      city: 'Seoul',
      country: 'South Korea',
      lat: 37.5448,
      lng: 127.0553,
    },
    status: 'Open',
    brandCategory: 'iic',
    openDate: '2021-10-01',
    area: 220,
    financial: {
      monthlyRent: 22000000,
      currency: 'KRW',
      monthlySales: 150000000,
      salesPerSqm: 681818,
      investment: 1200000000,
      yearlySales: [
        { year: 2023, amount: 1750000000 },
        { year: 2024, amount: 1900000000 },
        { year: 2025, amount: 2050000000 },
      ],
    },
  },
  {
    id: 'nd-tokyo-ginza',
    name: 'Nudake Ginza',
    brand: 'Nudake',
    type: 'Department Store',
    location: {
      city: 'Tokyo',
      country: 'Japan',
      lat: 35.6723,
      lng: 139.7652,
    },
    status: 'Construction',
    statusYear: 2025,
    brandCategory: 'iic',
    openDate: '2025-12-15',
    area: 150,
    financial: {
      monthlyRent: 3200000,
      currency: 'JPY',
      monthlySales: 0,
      salesPerSqm: 0,
      investment: 200000000,
      estimatedSales: 25000000,
      estimatedMargin: 32,
    },
  },
];

// ----------------------------------------------------------
// 경쟁사 브랜드 정의 기본 목록
// ----------------------------------------------------------
export const INITIAL_COMPETITOR_BRANDS: BrandDefinition[] = [
  { name: 'RayBan' },
  { name: 'Aesop' },
  { name: 'Pesade' },
  { name: 'London Bagel Museum' },
  { name: 'Matin Kim' },
  { name: 'Polga' },
];

// ----------------------------------------------------------
// 선호/인접 브랜드 정의 기본 목록
// ----------------------------------------------------------
export const INITIAL_PREFERRED_BRANDS: BrandDefinition[] = [
  { name: 'Acne Studios' },
  { name: 'Adidas' },
  { name: 'Alexander Wang' },
  { name: 'ALO' },
  { name: 'Ami' },
  { name: 'Apple' },
  { name: 'Balenciaga' },
  { name: 'Bottega Veneta' },
  { name: 'Burberry' },
  { name: 'Cartier' },
  { name: 'Celine' },
  { name: 'Chanel' },
  { name: 'Dior' },
  { name: 'Gucci' },
  { name: 'Hermes' },
  { name: 'Louis Vuitton' },
  { name: 'Lululemon' },
  { name: 'Miu Miu' },
  { name: 'Nike' },
  { name: 'PRADA' },
];

// ----------------------------------------------------------
// 국가/지역 매핑 테이블
// 국가명 → 지역 레이블 변환에 사용합니다.
// ----------------------------------------------------------
export const REGION_MAPPING = [
  {
    label: '한국',
    keywords: ['South Korea', 'Korea', 'Seoul', 'Busan', 'Daegu', 'Incheon'],
  },
  {
    label: '일본',
    keywords: ['Japan', 'Tokyo', 'Osaka', 'Kyoto', 'Fukuoka', 'Nagoya'],
  },
  {
    label: '중국',
    keywords: ['China', 'Hong Kong', 'Taiwan', 'Macau', 'Shanghai', 'Beijing', 'Chengdu'],
  },
  {
    label: '동남아',
    keywords: ['Singapore', 'Thailand', 'Vietnam', 'Malaysia', 'Indonesia', 'Philippines', 'Bangkok', 'Ho Chi Minh'],
  },
  {
    label: '미주',
    keywords: ['USA', 'Canada', 'Mexico', 'United States', 'America', 'New York', 'Los Angeles', 'Miami'],
  },
  {
    label: '유럽',
    keywords: ['UK', 'France', 'Germany', 'Italy', 'Spain', 'Europe', 'United Kingdom', 'London', 'Paris', 'Berlin', 'Milan'],
  },
  {
    label: '중동',
    keywords: ['UAE', 'Saudi Arabia', 'Dubai', 'Middle East', 'Qatar', 'Kuwait'],
  },
  {
    label: '호주',
    keywords: ['Australia', 'New Zealand', 'Sydney', 'Melbourne'],
  },
  {
    label: '기타',
    keywords: ['India', 'Brazil', 'Argentina', 'South Africa', 'Russia', 'Unknown'],
  },
];
