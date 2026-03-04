// ============================================================
// Supabase 클라이언트 설정
// 앱 전체에서 사용하는 Supabase 연결 객체입니다.
// 비전공자 설명: Supabase(데이터베이스 서비스)에 접속하기 위한 "통행증"을 만드는 파일입니다.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Supabase 프로젝트 URL (모든 API 요청이 이 주소로 전송됩니다)
const supabaseUrl = `https://${projectId}.supabase.co`;

// 동시 인증 요청 시 충돌을 방지하기 위한 간단한 잠금 메커니즘
// (여러 요청이 동시에 토큰을 갱신하려 할 때 순서대로 처리합니다)
let _lockPromise: Promise<any> = Promise.resolve();

// Supabase 클라이언트 인스턴스 생성
// 앱 전체에서 이 하나의 인스턴스를 공유합니다.
export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    // 인증 토큰을 브라우저 저장소에 저장할 때 사용하는 키
    storageKey: `sb-${projectId}-auth-token`,
    // 토큰 만료 시 자동으로 갱신
    autoRefreshToken: true,
    // 세션을 브라우저에 유지 (새로고침해도 로그인 유지)
    persistSession: true,
    // Navigator LockManager 타임아웃을 방지하기 위한 커스텀 잠금 구현
    lock: async (
      _name: string,
      _acquireTimeout: number,
      fn: () => Promise<any>,
    ) => {
      const prev = _lockPromise;
      let resolve: () => void;
      _lockPromise = new Promise<void>((r) => { resolve = r; });
      await prev;
      try {
        return await fn();
      } finally {
        resolve!();
      }
    },
  },
});