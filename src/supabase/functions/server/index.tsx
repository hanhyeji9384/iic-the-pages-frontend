// ============================================================
// index.tsx - Hono REST API 서버 (Supabase Edge Function)
// 이 파일은 Supabase Edge Function으로 배포되는 백엔드 서버입니다.
// Hono 프레임워크를 사용하여 HTTP API 엔드포인트(접속 주소)를 정의합니다.
// 비전공자 설명: 앱(브라우저)에서 "데이터 줘!" 라고 요청하면, 이 서버가
// DB에서 데이터를 꺼내 "여기 있어!" 하고 돌려주는 역할을 합니다.
// ============================================================

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { MOCK_IIC_STORES, MOCK_COMP_STORES, MOCK_PIPELINES } from "./seed_data.ts";

// Hono 앱 인스턴스를 생성합니다.
const app = new Hono();

// 모든 API 주소의 공통 시작 부분 (prefix)
const BASE_PATH = "/make-server-51087ee6";

// 파일 업로드에 사용할 Supabase Storage 버킷(폴더) 이름
const BUCKET_NAME = "make-51087ee6-photos";

// Supabase 관리자 클라이언트 생성
// 서버 측에서만 사용하는 슈퍼 권한 키로 초기화합니다.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ============================================================
// 파일 업로드 버킷 초기화 함수
// Storage 버킷이 없으면 자동으로 생성합니다.
// ============================================================
async function initBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    // 버킷이 없으면 새로 만듭니다.
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: false, // 비공개 버킷으로 설정 (서명된 URL로만 접근 가능)
      });
    }
  } catch (e) {
    console.error("Bucket init error:", e);
  }
}
// 서버 시작 시 버킷을 초기화합니다.
initBucket();

// 모든 요청/응답을 콘솔에 기록합니다. (디버깅용)
app.use('*', logger(console.log));

// ============================================================
// CORS 설정 (Cross-Origin Resource Sharing)
// 브라우저에서 다른 도메인의 API를 호출할 수 있도록 허용합니다.
// ============================================================
app.use(
  "/*",
  cors({
    origin: "*",                                               // 모든 도메인 허용
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600, // CORS preflight 결과를 10분간 캐시
  }),
);

// ============================================================
// 헬스 체크 - 서버가 살아있는지 확인하는 엔드포인트
// ============================================================
app.get(`${BASE_PATH}/health`, (c) => {
  return c.json({ status: "ok" });
});

// ============================================================
// 시딩 API - 초기 샘플 데이터를 DB에 심습니다.
// ?force=true 쿼리 파라미터를 붙이면 기존 데이터를 지우고 다시 심습니다.
// ============================================================
app.post(`${BASE_PATH}/seed`, async (c) => {
  try {
    const force = c.req.query("force") === "true";
    // 이미 IIC 매장 데이터가 있는지 확인합니다.
    const existing = await kv.getByPrefix("store:iic:");

    // 데이터가 없거나 강제 재시딩 요청이 있을 때만 실행합니다.
    if (existing.length === 0 || force) {
      console.log("Seeding data...");

      // force=true이면 기존 데이터를 모두 삭제합니다.
      if (force) {
        const keys = [
          ...(await kv.getByPrefix("store:iic:")).map(s => `store:iic:${s.id}`),
          ...(await kv.getByPrefix("store:comp:")).map(s => `store:comp:${s.id}`),
          ...(await kv.getByPrefix("pipeline:")).map(p => `pipeline:${p.id}`)
        ];
        for (const key of keys) {
          await kv.del(key);
        }
      }

      // IIC 매장 데이터를 DB에 저장합니다.
      for (const store of MOCK_IIC_STORES) {
        await kv.set(`store:iic:${store.id}`, store);
      }

      // 경쟁사 매장 데이터를 DB에 저장합니다.
      for (const store of MOCK_COMP_STORES) {
        await kv.set(`store:comp:${store.id}`, store);
      }

      // 파이프라인(연결선) 데이터를 DB에 저장합니다.
      for (const line of MOCK_PIPELINES) {
        await kv.set(`pipeline:${line.id}`, line);
      }

      return c.json({ message: "Data seeded successfully" });
    }
    return c.json({ message: "Data already exists" });
  } catch (e) {
    console.error(e);
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// IIC 매장 API 엔드포인트
// ============================================================

// IIC 매장 전체 목록 조회
app.get(`${BASE_PATH}/stores/iic`, async (c) => {
  try {
    const stores = await kv.getByPrefix("store:iic:");
    return c.json(stores);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 새 IIC 매장 추가
// 요청 본문(body)에서 매장 데이터를 받아 저장합니다.
app.post(`${BASE_PATH}/stores/iic`, async (c) => {
  try {
    const body = await c.req.json();
    // id가 없으면 현재 시간으로 자동 생성합니다.
    if (!body.id) {
      body.id = `iic-${Date.now()}`;
    }
    await kv.set(`store:iic:${body.id}`, body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// IIC 매장 정보 수정
// :id는 URL 경로에서 받는 매장 ID입니다.
app.put(`${BASE_PATH}/stores/iic/:id`, async (c) => {
  const id = c.req.param("id");
  console.log(`Updating IIC store: ${id}`);
  try {
    const body = await c.req.json();
    if (!body) throw new Error("Request body is empty");

    body.id = id; // URL의 ID로 덮어써서 일관성을 보장합니다.
    await kv.set(`store:iic:${id}`, body);
    console.log(`Successfully updated IIC store: ${id}`);
    return c.json(body);
  } catch (e) {
    console.error(`Error updating IIC store ${id}:`, e);
    return c.json({ error: e.message }, 500);
  }
});

// IIC 매장 삭제
app.delete(`${BASE_PATH}/stores/iic/:id`, async (c) => {
  const id = c.req.param("id");
  try {
    await kv.del(`store:iic:${id}`);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 경쟁사 매장 API 엔드포인트
// ============================================================

// 경쟁사 매장 전체 목록 조회
app.get(`${BASE_PATH}/stores/comp`, async (c) => {
  try {
    const stores = await kv.getByPrefix("store:comp:");
    return c.json(stores);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 새 경쟁사 매장 추가
app.post(`${BASE_PATH}/stores/comp`, async (c) => {
  try {
    const body = await c.req.json();
    if (!body.id) {
      body.id = `comp-${Date.now()}`;
    }
    await kv.set(`store:comp:${body.id}`, body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 경쟁사 매장 정보 수정
app.put(`${BASE_PATH}/stores/comp/:id`, async (c) => {
  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    body.id = id;
    await kv.set(`store:comp:${id}`, body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 경쟁사 매장 삭제
app.delete(`${BASE_PATH}/stores/comp/:id`, async (c) => {
  const id = c.req.param("id");
  try {
    await kv.del(`store:comp:${id}`);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 파이프라인(연결선) API 엔드포인트
// ============================================================

// 파이프라인 전체 목록 조회
app.get(`${BASE_PATH}/pipelines`, async (c) => {
  try {
    const lines = await kv.getByPrefix("pipeline:");
    return c.json(lines);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 새 파이프라인 추가
app.post(`${BASE_PATH}/pipelines`, async (c) => {
  try {
    const body = await c.req.json();
    if (!body.id) {
      body.id = `line-${Date.now()}`;
    }
    await kv.set(`pipeline:${body.id}`, body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 파이프라인 삭제
app.delete(`${BASE_PATH}/pipelines/:id`, async (c) => {
  const id = c.req.param("id");
  try {
    await kv.del(`pipeline:${id}`);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 트래픽 존(유동인구 구역) API 엔드포인트
// ============================================================

// 트래픽 존 전체 목록 조회
app.get(`${BASE_PATH}/traffic-zones`, async (c) => {
  try {
    const zones = await kv.getByPrefix("traffic-zone:");
    return c.json(zones);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 새 트래픽 존 추가
app.post(`${BASE_PATH}/traffic-zones`, async (c) => {
  try {
    const body = await c.req.json();
    if (!body.id) {
      body.id = `zone-${Date.now()}`;
    }
    await kv.set(`traffic-zone:${body.id}`, body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 트래픽 존 삭제
app.delete(`${BASE_PATH}/traffic-zones/:id`, async (c) => {
  const id = c.req.param("id");
  try {
    await kv.del(`traffic-zone:${id}`);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 협상 이력(Negotiation History) API 엔드포인트
// 매장별 협상 과정을 날짜순으로 기록합니다.
// ============================================================

// 특정 매장의 협상 이력 조회
app.get(`${BASE_PATH}/negotiation-history/:storeId`, async (c) => {
  const storeId = c.req.param("storeId");
  try {
    const history = await kv.get(`neg_history:${storeId}`);
    // 데이터가 없으면 빈 배열을 반환합니다.
    return c.json(history || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 특정 매장의 협상 이력 저장/업데이트
app.put(`${BASE_PATH}/negotiation-history/:storeId`, async (c) => {
  const storeId = c.req.param("storeId");
  try {
    const body = await c.req.json();
    await kv.set(`neg_history:${storeId}`, body);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 체크포인트(Checkpoints) API 엔드포인트
// 매장별 단계 진행 체크리스트를 관리합니다.
// ============================================================

// 특정 매장의 체크포인트 목록 조회
app.get(`${BASE_PATH}/checkpoints/:storeId`, async (c) => {
  const storeId = c.req.param("storeId");
  try {
    const checkpoints = await kv.get(`checkpoints:${storeId}`);
    return c.json(checkpoints || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 특정 매장의 체크포인트 목록 저장/업데이트
app.put(`${BASE_PATH}/checkpoints/:storeId`, async (c) => {
  const storeId = c.req.param("storeId");
  try {
    const body = await c.req.json();
    await kv.set(`checkpoints:${storeId}`, body);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 목표(Goals) API 엔드포인트
// 전체 파이프라인 목표 수치를 관리합니다.
// ============================================================

// 목표 데이터 조회
app.get(`${BASE_PATH}/goals`, async (c) => {
  try {
    const goals = await kv.get("iic_goals");
    return c.json(goals || {});
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 목표 데이터 저장
app.post(`${BASE_PATH}/goals`, async (c) => {
  try {
    const body = await c.req.json();
    await kv.set("iic_goals", body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 브랜드 목록 API 엔드포인트 (경쟁사 / 선호 브랜드)
// ============================================================

// 경쟁사 브랜드 목록 조회
app.get(`${BASE_PATH}/brands/competitor`, async (c) => {
  try {
    const brands = await kv.get("brands_competitor");
    return c.json(brands || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 경쟁사 브랜드 목록 저장
app.post(`${BASE_PATH}/brands/competitor`, async (c) => {
  try {
    const body = await c.req.json();
    await kv.set("brands_competitor", body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 선호/인접 브랜드 목록 조회
app.get(`${BASE_PATH}/brands/preferred`, async (c) => {
  try {
    const brands = await kv.get("brands_preferred");
    return c.json(brands || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 선호/인접 브랜드 목록 저장
app.post(`${BASE_PATH}/brands/preferred`, async (c) => {
  try {
    const body = await c.req.json();
    await kv.set("brands_preferred", body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 일정 이벤트(Schedule Events) API 엔드포인트
// ============================================================

// 일정 이벤트 전체 목록 조회
app.get(`${BASE_PATH}/schedule-events`, async (c) => {
  try {
    const events = await kv.get("schedule_events");
    return c.json(events || []);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// 일정 이벤트 목록 저장
app.post(`${BASE_PATH}/schedule-events`, async (c) => {
  try {
    const body = await c.req.json();
    await kv.set("schedule_events", body);
    return c.json(body);
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// ============================================================
// 파일 업로드 API 엔드포인트
// 매장 사진 등을 Supabase Storage에 업로드합니다.
// ============================================================
app.post(`${BASE_PATH}/upload`, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");

    // 파일이 없거나 올바른 파일 형식이 아니면 오류를 반환합니다.
    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded or invalid file format" }, 400);
    }

    // 업로드 전 버킷이 있는지 한번 더 확인합니다. (안전 장치)
    await initBucket();

    // 파일 확장자를 추출하고, 특수문자를 제거한 안전한 파일명을 만듭니다.
    const fileExt = file.name.split('.').pop();
    const safeName = file.name
      .split('.')
      .shift()
      ?.replace(/[^a-z0-9]/gi, '_') // 영문/숫자 외 문자는 _ 로 변환
      .toLowerCase();
    // 타임스탬프를 붙여 파일명이 겹치지 않게 합니다.
    const fileName = `${Date.now()}-${safeName}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();

    console.log(`Uploading file: ${fileName}, size: ${arrayBuffer.byteLength}`);

    // Supabase Storage에 파일을 업로드합니다.
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, arrayBuffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true // 같은 이름의 파일이 있으면 덮어씁니다.
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return c.json({ error: `Storage error: ${error.message}` }, 500);
    }

    // 1년(31536000초) 동안 유효한 서명된 접근 URL을 생성합니다.
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, 31536000);

    if (signedError) {
      console.error("Signed URL error:", signedError);
      return c.json({ error: `Signed URL error: ${signedError.message}` }, 500);
    }

    // 저장 경로와 접근 URL을 반환합니다.
    return c.json({ path: data.path, url: signedData.signedUrl });
  } catch (e) {
    console.error("Upload process error:", e);
    return c.json({ error: `Upload process error: ${e.message}` }, 500);
  }
});

// Deno 서버를 시작합니다. (Supabase Edge Function 진입점)
Deno.serve(app.fetch);
