// ============================================================
// seed_data.ts - 초기 시딩(Seed) 데이터
// 이 파일은 서버 DB가 처음 실행될 때 자동으로 채워지는 샘플 데이터를 정의합니다.
// 비전공자 설명: 마치 새로운 앱을 설치했을 때 "예시 데이터"가 미리 들어있는 것처럼,
// 서버를 처음 켰을 때 보여줄 샘플 매장/파이프라인 데이터입니다.
// ============================================================

// ============================================================
// MOCK_IIC_STORES - IIC 계열 브랜드(젠틀몬스터 등) 샘플 매장 목록
// ============================================================
export const MOCK_IIC_STORES = [
  {
    id: 'store-1',
    name: 'Tokyo Aoyama FS',
    brand: 'Gentle Monster',
    type: 'FS', // 플래그십스토어
    location: { city: 'Minato City', country: 'Japan', lat: 35.6634, lng: 139.7126 },
    size: '120m²',
    area: 120,
    rent: '₩5,000만',
    status: 'Open',       // 현재 오픈 상태
    statusYear: 2024,
    openDate: '2021-02-24',
    visitors: 12500,      // 월 방문객 수
    contract: {
      startDate: '2020-09-01',
      endDate: '2030-08-31',
      renewalOption: true,
      documentUrl: '#'
    },
    financial: {
      monthlyRent: 85000000,         // 월 임대료 (원)
      currency: 'KRW',
      monthlySales: 1250000000,      // 월 매출 (원)
      salesPerSqm: 2100000,          // 평방미터당 매출
      investment: 3500000000         // 총 투자비 (원)
    },
    images: {
      front: 'https://images.unsplash.com/photo-1580754857416-83141f22496a?q=80&w=2070&auto=format&fit=crop',
      side: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
      interior: 'https://images.unsplash.com/photo-1580754857416-83141f22496a?q=80&w=2070&auto=format&fit=crop',
    },
    negotiationHistory: [
      { date: '2020-08-15', notes: 'Initial negotiation sent', user: 'James Kim' },
      { date: '2020-08-20', notes: 'Rent negotiation meeting', user: 'James Kim' },
      { date: '2020-09-01', notes: 'Contract signed', user: 'Sarah Lee' }
    ]
  },
  {
    id: 'store-2',
    name: 'Sinsa FS',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      address: '533-6 Sinsa-dong, Gangnam-gu',
      city: 'Seoul',
      country: 'Korea',
      region: 'Gangnam',
      lat: 37.5202,
      lng: 127.0227
    },
    size: '180m²',
    area: 450,
    rent: '₩5500k',
    status: 'Open',
    statusYear: 2024,
    openDate: '2017-05-12',
    visitors: 8500,
    contract: {
      startDate: '2017-05-12',
      endDate: '2026-03-20',
      renewalOption: true
    },
    financial: {
      monthlyRent: 55000000,
      currency: 'KRW',
      monthlySales: 850000000,
      salesPerSqm: 1880000,
      investment: 2000000000
    },
    images: {
      interior: 'https://images.unsplash.com/photo-1543360432-882269a23c0b?q=80&w=2070&auto=format&fit=crop'
    }
  },
  {
    id: 'store-3',
    name: 'Hongdae FS',
    brand: 'Gentle Monster',
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5575, lng: 126.9245 },
    size: '180m²',
    rent: '₩5500k',
    status: 'Open',
    statusYear: 2024,
  },
  {
    id: 'store-4',
    name: 'Lotte World Tower',
    brand: 'Gentle Monster',
    type: 'Department Store', // 백화점 입점
    location: { city: 'Seoul', country: 'Korea', lat: 37.5126, lng: 127.1026 },
    size: '80m²',
    rent: '₩4200k',
    status: 'Open',
    statusYear: 2024,
  },
  {
    id: 'store-5',
    name: 'Starfield Hanam',
    brand: 'Gentle Monster',
    type: 'Department Store',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5455, lng: 127.2236 },
    size: '80m²',
    rent: '₩4200k',
    status: 'Open',
    statusYear: 2024,
  },
  {
    id: 'store-6',
    name: 'Galleria (Apgujeong)',
    brand: 'Gentle Monster',
    type: 'Department Store',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5283, lng: 127.0418 },
    size: '80m²',
    rent: '₩4200k',
    status: 'Open',
    statusYear: 2024,
  },
  {
    id: 'store-7',
    name: 'New York Flagship',
    brand: 'Gentle Monster',
    type: 'FS',
    location: { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
    size: '220m²',
    status: 'Signed',   // 계약 완료, 오픈 준비 중
    statusYear: 2025,
  },
  {
    id: 'store-8',
    name: 'London Soho',
    brand: 'Gentle Monster',
    type: 'FS',
    location: { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
    size: '150m²',
    status: 'Negotiation', // 협상 진행 중
    statusYear: 2026,
  },
  {
    id: 'store-9',
    name: 'GM_Soho(Plan)',
    brand: 'Gentle Monster',
    type: 'FS',
    location: {
      address: 'Prince St & Broadway, Soho',
      city: 'New York',
      country: 'USA',
      region: 'Manhattan',
      lat: 40.7246,
      lng: -73.9983
    },
    area: 250,
    status: 'Planned',   // 계획 단계
    statusYear: 2027,
    images: {
      front: 'https://images.unsplash.com/photo-1641973841453-b9db2229b54c?q=80&w=1080&auto=format&fit=crop',
      side: 'https://images.unsplash.com/photo-1758633854736-8973bcd84dd1?q=80&w=1080&auto=format&fit=crop',
      interior: 'https://images.unsplash.com/photo-1765009433753-c7462637d21f?q=80&w=1080&auto=format&fit=crop',
      floorplan: 'https://images.unsplash.com/photo-1721244654346-9be0c0129e36?q=80&w=1080&auto=format&fit=crop'
    },
    negotiationHistory: [
      { date: '2025-11-20', notes: 'Site visit and initial rent discussion', user: 'Mark Wilson' },
      { date: '2025-12-05', notes: 'Preliminary floor plan received', user: 'Jessica Chen' },
      { date: '2025-12-20', notes: 'Awaiting landlord approval on signage', user: 'Mark Wilson' }
    ]
  },
  {
    id: 'store-10',
    name: 'London HAUS',
    brand: 'Gentle Monster',
    type: 'Haus', // 하우스 형태의 매장
    location: { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
    size: '150m²',
    area: 150,
    status: 'Confirm',  // 확인/검토 단계
    statusYear: 2026,
  },
];

// ============================================================
// MOCK_COMP_STORES - 경쟁사 및 인접 브랜드 샘플 매장 목록
// ============================================================
export const MOCK_COMP_STORES = [
  {
    id: '101',
    name: 'RayBan Starfield',
    brand: 'RayBan',
    brandCategory: 'competitor', // 경쟁사 브랜드
    type: 'Department Store',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5450, lng: 127.2230 },
    size: '60m²',
    status: 'Open',
    rent: '₩3500k',
    images: {
      front: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=2080&auto=format&fit=crop'
    }
  },
  {
    id: '103',
    name: 'Acne Studios Cheongdam',
    brand: 'Acne Studios',
    brandCategory: 'preferred', // 선호/인접 브랜드
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5245, lng: 127.0435 },
    size: '200m²',
    status: 'Open',
    rent: '₩7500k',
    images: {
      front: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=2076&auto=format&fit=crop'
    }
  },
  {
    id: '104',
    name: 'Apple Myeongdong',
    brand: 'Apple',
    brandCategory: 'competitor',
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5642, lng: 126.9850 },
    size: '450m²',
    status: 'Open',
    contract: {
      startDate: '2022-04-01',
      endDate: '2027-03-31',
      renewalOption: false
    },
    images: {
      front: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=2064&auto=format&fit=crop'
    }
  },
  {
    id: '105',
    name: 'Nike Gangnam',
    brand: 'Nike',
    brandCategory: 'competitor',
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5023, lng: 127.0279 },
    size: '520m²',
    status: 'Open',
    contract: {
      startDate: '2023-10-01',
      endDate: '2026-10-01',
      renewalOption: true
    },
    images: {
      front: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop'
    }
  },
  {
    id: '107',
    name: 'Lululemon Cheongdam',
    brand: 'Lululemon',
    brandCategory: 'competitor',
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5258, lng: 127.0410 },
    size: '280m²',
    status: 'Open',
    images: {
      front: 'https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?q=80&w=2072&auto=format&fit=crop'
    }
  },
  {
    id: '108',
    name: 'Burberry Flagship Seoul',
    brand: 'Burberry',
    brandCategory: 'competitor',
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5250, lng: 127.0420 },
    size: '450m²',
    status: 'Open',
    images: {
      front: 'https://images.unsplash.com/photo-1541336032412-2048a678540d?q=80&w=1974&auto=format&fit=crop'
    }
  },
  {
    id: '109',
    name: 'Adidas Brand Center SNW',
    brand: 'Adidas',
    brandCategory: 'competitor',
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5240, lng: 127.0400 },
    size: '1200m²',
    status: 'Open',
    images: {
      front: 'https://images.unsplash.com/photo-1511746015091-c6741708846c?q=80&w=2070&auto=format&fit=crop'
    }
  },
  {
    id: '110',
    name: 'Chanel Flagship Seoul',
    brand: 'Chanel',
    brandCategory: 'competitor',
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5265, lng: 127.0395 },
    size: '520m²',
    status: 'Open',
    images: {
      front: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop'
    }
  },
  {
    id: '111',
    name: 'ALO Yoga Dosan',
    brand: 'ALO',
    brandCategory: 'competitor',
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5230, lng: 127.0380 },
    size: '320m²',
    status: 'Open',
    images: {
      front: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1820&auto=format&fit=crop'
    }
  },
  {
    id: '112',
    name: 'Meta Reality Lab Seoul',
    brand: 'Meta',
    brandCategory: 'smartglass', // 스마트 글라스 카테고리
    type: 'FS',
    location: { city: 'Seoul', country: 'Korea', lat: 37.5665, lng: 126.9780 },
    size: '150m²',
    status: 'Open',
    images: {
      front: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?q=80&w=2070&auto=format&fit=crop'
    }
  },
  {
    id: '113',
    name: 'XREAL Pop-up Gangnam',
    brand: 'XREAL',
    brandCategory: 'smartglass',
    type: 'Pop-up', // 팝업 매장
    location: { city: 'Seoul', country: 'Korea', lat: 37.4979, lng: 127.0276 },
    size: '40m²',
    status: 'Open',
    images: {
      front: 'https://images.unsplash.com/photo-1592477976530-64782354643f?q=80&w=2070&auto=format&fit=crop'
    }
  }
];

// ============================================================
// MOCK_PIPELINES - 초기 파이프라인(지도 연결선) 샘플 데이터
// 두 좌표를 연결하는 선으로, 글로벌 확장 경로 등을 표시합니다.
// ============================================================
export const MOCK_PIPELINES = [
  {
    id: "line-1",
    point1: { lat: 40.7141, lng: -74.0063 }, // 뉴욕
    point2: { lat: 51.5074, lng: -0.1278 },  // 런던
    color: "#EF4444",                          // 빨간색 선
    title: "Global Expansion: NY - London",
    thickness: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "line-2",
    point1: { lat: 37.5255, lng: 127.0355 }, // 서울 HAUS 도산
    point2: { lat: 37.5447, lng: 127.0557 }, // 서울 성수
    color: "#3B82F6",                          // 파란색 선
    title: "Local Logistics",
    thickness: 2,
    createdAt: new Date().toISOString(),
  }
];
