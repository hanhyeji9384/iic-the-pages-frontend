// ============================================================
// mockLineServer.ts - 로컬 Mock 라인(파이프라인 연결선) 서버
// 이 파일은 지도 위에 그려지는 '연결선'(라인)을 메모리에 저장하고 관리하는 가짜 서버입니다.
// 비전공자 설명: 실제 서버 없이도 라인 데이터를 저장/불러오기/삭제할 수 있게 해주는 도구입니다.
// ============================================================

// 지도 좌표(위도/경도)를 나타내는 데이터 구조
export interface Coordinate {
  lat: number; // 위도 (세로 방향 좌표)
  lng: number; // 경도 (가로 방향 좌표)
}

// 저장된 라인(연결선) 하나의 데이터 구조
export interface SavedLine {
  id: string;           // 라인 고유 식별자
  point1: Coordinate;   // 시작점 좌표
  point2: Coordinate;   // 끝점 좌표
  color: string;        // 라인 색상 (예: "#EF4444")
  title: string;        // 라인 이름/설명
  thickness: number;    // 라인 두께
  createdAt: string;    // 생성 일시 (ISO 문자열)
}

// 메모리에 임시 저장되는 라인 목록 (초기 예시 데이터 포함)
let lines: SavedLine[] = [
  {
    id: "line-1",
    point1: { lat: 40.714158, lng: -74.006316 }, // 뉴욕 엠파이어 스테이트 빌딩 부근
    point2: { lat: 40.713158, lng: -74.00409 },  // 뉴욕 월가 부근
    color: "#EF4444",
    title: "Example Line",
    thickness: 20,
    createdAt: new Date().toISOString(),
  },
];

// 라인 서버 기능 모음 (실제 API처럼 사용할 수 있는 함수들)
export const mockLineServer = {
  // 저장된 모든 라인 목록을 가져옵니다.
  // 네트워크 지연을 흉내 내기 위해 500ms 대기 후 반환합니다.
  getLines: async (): Promise<SavedLine[]> => {
    // 실제 네트워크 요청처럼 약간의 지연을 시뮬레이션합니다.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...lines];
  },

  // 새 라인을 추가합니다.
  // 두 점의 좌표, 색상, 제목, 두께를 받아 새 라인 객체를 생성하고 저장합니다.
  addLine: async (
    point1: Coordinate,
    point2: Coordinate,
    color: string,
    title: string,
    thickness: number,
  ): Promise<SavedLine> => {
    // 실제 저장 요청처럼 약간의 지연을 시뮬레이션합니다.
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 현재 시간을 기반으로 고유한 ID를 생성합니다.
    const newLine: SavedLine = {
      id: `line-${Date.now()}`,
      point1,
      point2,
      color,
      title,
      thickness,
      createdAt: new Date().toISOString(),
    };

    // 새 라인을 목록 맨 앞에 추가합니다.
    lines = [newLine, ...lines];
    return newLine;
  },

  // 특정 라인을 삭제합니다.
  // id에 해당하는 라인을 목록에서 제거합니다.
  deleteLine: async (id: string): Promise<void> => {
    // 삭제 요청처럼 약간의 지연을 시뮬레이션합니다.
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 해당 id를 가진 라인만 제외하고 나머지를 유지합니다.
    lines = lines.filter((line) => line.id !== id);
  },
};
