// 관리자 전용 계정 관리 화면
// - 사용자 목록 조회, 역할 변경, 활성/비활성 토글, 추가/수정/삭제 기능 제공
// - 실제 서버 없이 브라우저 로컬스토리지에 데이터를 저장하는 Mock 방식으로 동작합니다
//   (LocalStorage = 브라우저에 내장된 임시 저장 공간. 서버 없이도 데이터 보관 가능)
import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  ChevronDown,
  MoreHorizontal,
  Shield,
  Pencil,
  Eye,
  Trash2,
  UserX,
  UserCheck,
  X,
  AlertTriangle,
  Check,
  Loader2,
  KeyRound,
} from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

// 사용자 프로필 데이터 구조 정의 (각 항목이 어떤 정보인지 타입으로 명시)
interface UserProfile {
  id: string;           // 고유 식별자
  auth_id: string | null; // 인증 시스템 연결 ID (Mock에서는 항상 null)
  email: string;        // 이메일 주소
  name: string;         // 표시 이름
  role: "admin" | "editor" | "viewer"; // 역할: 관리자/편집자/뷰어
  department: string | null; // 부서 (없을 수 있음)
  avatar_url: string | null; // 프로필 사진 URL (없을 수 있음)
  is_active: boolean;   // 활성 상태 여부
  created_at: string;   // 생성 일시 (ISO 형식 문자열)
  updated_at: string;   // 수정 일시 (ISO 형식 문자열)
}

type RoleBadge = "admin" | "editor" | "viewer";

// 역할별 표시 설정 (색상, 아이콘 등)
const ROLE_CONFIG: Record<RoleBadge, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  admin:  { label: "Admin",  color: "text-red-700",    bg: "bg-red-50 border-red-200",    icon: Shield },
  editor: { label: "Editor", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200", icon: Pencil },
  viewer: { label: "Viewer", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   icon: Eye },
};

// ─── Mock 스토리지 키 ─────────────────────────────────────────────────────────

// 로컬스토리지에서 사용자 데이터를 저장/불러올 때 사용하는 키 이름
const MOCK_STORAGE_KEY = "thepages_mock_users";

// 앱 최초 실행 시 로컬스토리지가 비어있으면 삽입할 샘플 사용자 3명
const INITIAL_MOCK_USERS: UserProfile[] = [
  {
    id: "mock-1",
    auth_id: null,
    email: "admin@uli.com",
    name: "관리자",
    role: "admin",
    department: "Expansion",
    avatar_url: null,
    is_active: true,
    created_at: "2024-01-15T09:00:00Z",
    updated_at: "2024-01-15T09:00:00Z",
  },
  {
    id: "mock-2",
    auth_id: null,
    email: "editor@uli.com",
    name: "편집자",
    role: "editor",
    department: "Design",
    avatar_url: null,
    is_active: true,
    created_at: "2024-03-20T10:00:00Z",
    updated_at: "2024-03-20T10:00:00Z",
  },
  {
    id: "mock-3",
    auth_id: null,
    email: "viewer@uli.com",
    name: "뷰어",
    role: "viewer",
    department: null,
    avatar_url: null,
    is_active: true,
    created_at: "2024-06-01T14:00:00Z",
    updated_at: "2024-06-01T14:00:00Z",
  },
];

// ─── Mock 스토리지 헬퍼 함수들 ────────────────────────────────────────────────

/**
 * 로컬스토리지에서 사용자 목록을 읽어옵니다.
 * 데이터가 없으면 초기 샘플 3명을 자동으로 저장한 뒤 반환합니다.
 */
function loadUsersFromStorage(): UserProfile[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) {
      // 처음 실행 시: 샘플 데이터를 로컬스토리지에 저장
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_USERS));
      return INITIAL_MOCK_USERS;
    }
    return JSON.parse(raw) as UserProfile[];
  } catch {
    // JSON 파싱 오류 시 샘플 데이터로 복구
    return INITIAL_MOCK_USERS;
  }
}

/**
 * 사용자 목록 전체를 로컬스토리지에 저장합니다.
 */
function saveUsersToStorage(users: UserProfile[]): void {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(users));
}

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────────────────────

// ISO 날짜 문자열을 "YYYY. MM. DD." 형식으로 변환합니다
function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const AdminUsersSection: React.FC = () => {
  // 화면에 표시할 사용자 목록
  const [users, setUsers] = useState<UserProfile[]>([]);
  // 데이터를 불러오는 중인지 여부 (로딩 스피너 표시 용도)
  const [loading, setLoading] = useState(true);
  // 검색창에 입력한 텍스트
  const [searchQuery, setSearchQuery] = useState("");
  // 역할 필터 ("all" | "admin" | "editor" | "viewer")
  const [roleFilter, setRoleFilter] = useState<string>("all");
  // 상태 필터 ("all" | "active" | "inactive")
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 각 다이얼로그(팝업) 표시 여부 및 대상 사용자
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<UserProfile | null>(null);
  const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);

  // ─── 데이터 로드 (로컬스토리지에서 읽기) ──────────────────────────────────

  // 로컬스토리지에서 사용자 목록을 불러오는 함수
  // useCallback: 이 함수가 불필요하게 재생성되지 않도록 최적화
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // 짧은 지연을 두어 실제 로딩처럼 자연스럽게 표시
      await new Promise((r) => setTimeout(r, 150));
      const data = loadUsersFromStorage();
      // 생성일 내림차순으로 정렬 (가장 최근 사용자가 위에 표시)
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setUsers(sorted);
    } catch (e: any) {
      console.error("[AdminUsers] Load error:", e);
      toast.error(`사용자 목록 로딩 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트가 처음 화면에 나타날 때 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── 필터링된 사용자 목록 ─────────────────────────────────────────────────

  // 검색어 + 역할 필터 + 상태 필터를 모두 적용한 결과
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    // 이메일, 이름, 부서 중 하나라도 검색어를 포함하면 통과
    const matchesSearch =
      !q ||
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.department || "").toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.is_active) ||
      (statusFilter === "inactive" && !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ─── 데이터 변경 함수들 (모두 로컬스토리지 직접 수정) ────────────────────

  // 사용자의 활성/비활성 상태를 반전시킵니다
  const handleToggleActive = async (user: UserProfile) => {
    try {
      const all = loadUsersFromStorage();
      const updated = all.map((u) =>
        u.id === user.id
          ? { ...u, is_active: !u.is_active, updated_at: new Date().toISOString() }
          : u
      );
      saveUsersToStorage(updated);
      toast.success(`${user.name} 계정이 ${user.is_active ? "비활성화" : "활성화"}되었습니다.`);
      fetchUsers();
    } catch (e: any) {
      toast.error(`상태 변경 실패: ${e.message}`);
    }
    setActionMenuUser(null);
  };

  // 사용자의 역할(admin/editor/viewer)을 변경합니다
  const handleRoleChange = async (user: UserProfile, newRole: string) => {
    if (newRole === user.role) return; // 이미 같은 역할이면 변경하지 않음
    try {
      const all = loadUsersFromStorage();
      const updated = all.map((u) =>
        u.id === user.id
          ? { ...u, role: newRole as UserProfile["role"], updated_at: new Date().toISOString() }
          : u
      );
      saveUsersToStorage(updated);
      toast.success(`${user.name}의 역할이 ${newRole}(으)로 변경되었습니다.`);
      fetchUsers();
    } catch (e: any) {
      toast.error(`역할 변경 실패: ${e.message}`);
    }
  };

  // 사용자를 영구 삭제합니다
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const all = loadUsersFromStorage();
      // 삭제 대상 ID를 제외한 나머지만 저장
      const filtered = all.filter((u) => u.id !== deletingUser.id);
      saveUsersToStorage(filtered);
      toast.success(`${deletingUser.name} 계정이 삭제되었습니다.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (e: any) {
      console.error("[AdminUsers] Delete error:", e);
      toast.error(`삭제 실패: ${e.message}`);
    }
  };

  // 사용자 정보(이름, 역할, 부서)를 수정합니다
  const handleUpdateUser = async (id: string, updates: Record<string, any>) => {
    try {
      const all = loadUsersFromStorage();
      const updated = all.map((u) =>
        u.id === id ? { ...u, ...updates, updated_at: new Date().toISOString() } : u
      );
      saveUsersToStorage(updated);
      toast.success("사용자 정보가 수정되었습니다.");
      setEditingUser(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(`수정 실패: ${e.message}`);
    }
  };

  // ─── 통계 계산 ───────────────────────────────────────────────────────────

  // 상단 통계 바에 표시할 숫자들
  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    editors: users.filter((u) => u.role === "editor").length,
    viewers: users.filter((u) => u.role === "viewer").length,
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">
      {/* 헤더: 제목 + 새로고침/사용자추가 버튼 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl min-[2560px]:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              계정 관리
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              사용자 계정 CRUD, 역할 변경, 활성/비활성 관리
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowAddDialog(true)}
            >
              <UserPlus className="w-3.5 h-3.5" />
              사용자 추가
            </Button>
          </div>
        </div>
      </div>

      {/* 통계 바: 전체/활성/비활성/역할별 카운트 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {[
          { label: "전체", value: stats.total, color: "bg-slate-100 text-slate-700" },
          { label: "활성", value: stats.active, color: "bg-green-50 text-green-700" },
          { label: "비활성", value: stats.inactive, color: "bg-gray-100 text-gray-500" },
          { label: "Admin", value: stats.admins, color: "bg-red-50 text-red-700" },
          { label: "Editor", value: stats.editors, color: "bg-amber-50 text-amber-700" },
          { label: "Viewer", value: stats.viewers, color: "bg-blue-50 text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg px-3 py-2 ${s.color} text-center`}>
            <p className="text-lg font-bold leading-tight">{s.value}</p>
            <p className="text-[10px] font-medium opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 필터 바: 검색창 + 역할 필터 + 상태 필터 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="이메일, 이름, 부서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">모든 역할</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">모든 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
        <span className="text-[11px] text-gray-400 ml-auto">
          {filteredUsers.length}건 표시
        </span>
      </div>

      {/* 사용자 테이블 */}
      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200">
        {loading ? (
          // 로딩 중: 스피너 표시
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          // 데이터가 없거나 검색 결과가 없을 때
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="w-10 h-10 mb-2 text-gray-200" />
            <p className="text-sm font-medium">
              {users.length === 0 ? "등록된 사용자가 없습니다" : "검색 결과가 없습니다"}
            </p>
          </div>
        ) : (
          // 사용자 목록 테이블
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 w-[200px]">이메일</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 w-[120px]">이름</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 w-[100px]">역할</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 w-[100px]">부서</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 w-[70px]">상태</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 w-[100px]">가입일</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50/80 transition-colors ${!user.is_active ? "opacity-50" : ""}`}
                  >
                    {/* 이메일 + 아바타 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-gray-700 font-medium truncate">{user.email}</span>
                      </div>
                    </td>
                    {/* 이름 */}
                    <td className="px-4 py-3 text-gray-700 font-medium">{user.name}</td>
                    {/* 역할 변경 드롭다운 */}
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          className={`appearance-none pl-2 pr-6 py-1 rounded-md border text-[11px] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${rc.bg} ${rc.color}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                      </div>
                    </td>
                    {/* 부서 */}
                    <td className="px-4 py-3 text-gray-500">{user.department || "—"}</td>
                    {/* 활성 상태 배지 */}
                    <td className="px-4 py-3 text-center">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          활성
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          비활성
                        </span>
                      )}
                    </td>
                    {/* 가입일 */}
                    <td className="px-4 py-3 text-gray-400">{formatDate(user.created_at)}</td>
                    {/* 액션 메뉴 (점 세 개 버튼) */}
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenuUser(actionMenuUser === user.id ? null : user.id)}
                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                        {/* 드롭다운 메뉴 */}
                        {actionMenuUser === user.id && (
                          <>
                            {/* 메뉴 바깥 클릭 시 닫기 */}
                            <div className="fixed inset-0 z-40" onClick={() => setActionMenuUser(null)} />
                            <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                              <button
                                onClick={() => { setEditingUser(user); setActionMenuUser(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil className="w-3.5 h-3.5" /> 정보 수정
                              </button>
                              <button
                                onClick={() => handleToggleActive(user)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                {user.is_active ? (
                                  <><UserX className="w-3.5 h-3.5 text-amber-500" /> 비활성화</>
                                ) : (
                                  <><UserCheck className="w-3.5 h-3.5 text-green-500" /> 활성화</>
                                )}
                              </button>
                              <button
                                onClick={() => { setPasswordResetUser(user); setActionMenuUser(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-violet-500" /> 비밀번호 변경
                              </button>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={() => { setDeletingUser(user); setActionMenuUser(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> 삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 다이얼로그 (팝업 창) 렌더링 */}
      {showAddDialog && (
        <AddUserDialog
          onClose={() => setShowAddDialog(false)}
          onCreated={() => { setShowAddDialog(false); fetchUsers(); }}
        />
      )}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      )}
      {deletingUser && (
        <DeleteConfirmDialog
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
        />
      )}
      {passwordResetUser && (
        <PasswordResetDialog
          user={passwordResetUser}
          onClose={() => setPasswordResetUser(null)}
        />
      )}
    </div>
  );
};

// =============================================================================
// 사용자 추가 다이얼로그
// - 이메일, 이름, 역할, 부서를 입력받아 로컬스토리지에 새 사용자를 저장합니다
// - 실제 서버/인증 없이 Mock 데이터만 생성합니다 (비밀번호 미저장)
// =============================================================================

function AddUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  // 입력 폼 상태
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 자동 생성 비밀번호: 이메일 아이디 + "!@" (Mock에서는 표시만 하고 실제 저장은 안 함)
  const emailPrefix = email.split("@")[0];
  const generatedPassword = emailPrefix ? `${emailPrefix}!@` : "";
  const isPasswordValid = generatedPassword.length >= 6;

  // 폼 제출 처리: 로컬스토리지에 새 사용자를 추가합니다
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !name) {
      toast.error("이메일, 이름은 필수입니다.");
      return;
    }
    if (!isPasswordValid) {
      toast.error("이메일 아이디가 너무 짧습니다. (최소 4자 필요 → 비밀번호 6자 이상)");
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      // 기존 사용자 목록을 로컬스토리지에서 불러옴
      const all = loadUsersFromStorage();

      // 이미 같은 이메일이 존재하는지 확인
      const alreadyExists = all.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (alreadyExists) {
        toast.error(`이미 등록된 이메일입니다: ${email}`);
        return;
      }

      // 새 사용자 객체 생성 (고유 ID는 현재 시각 기반으로 생성)
      const now = new Date().toISOString();
      const newUser: UserProfile = {
        id: `mock-${Date.now()}`,
        auth_id: null, // Mock이므로 인증 연결 없음
        email,
        name,
        role: role as UserProfile["role"],
        department: department || null,
        avatar_url: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      // 기존 목록 앞에 추가하여 저장
      saveUsersToStorage([newUser, ...all]);

      toast.success(
        `${name} (${email}) 계정이 생성되었습니다.\n초기 비밀번호 (참고용): ${generatedPassword}`,
        { duration: 8000 }
      );
      onCreated();
    } catch (err: any) {
      console.error("[AddUser] Error:", err);
      toast.error(`사용자 생성 실패: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* 다이얼로그 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">새 사용자 추가</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 이메일 입력 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">이메일 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          {/* 이름 입력 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* 자동 생성 비밀번호 미리보기 (Mock에서는 참고용 표시만) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">초기 비밀번호 (자동 생성, 참고용)</label>
            <div className="w-full px-3 py-2 text-xs border border-gray-100 rounded-lg bg-gray-50 text-gray-500 font-mono tracking-wide">
              {generatedPassword || <span className="text-gray-300 font-sans">이메일을 입력하면 자동 생성됩니다</span>}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              규칙: 이메일 아이디 + <code className="bg-gray-100 px-1 rounded">!@</code> &nbsp;
              {generatedPassword && !isPasswordValid && (
                <span className="text-red-500">(이메일 아이디가 너무 짧습니다 — 최소 4자 필요)</span>
              )}
              {generatedPassword && isPasswordValid && (
                <span className="text-green-600">— Mock 데이터이므로 실제 로그인에는 사용되지 않습니다</span>
              )}
            </p>
          </div>

          {/* 역할 + 부서 선택 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">역할</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">부서</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: Expansion"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* 취소/생성 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onClose}>
              취소
            </Button>
            <Button
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              disabled={submitting || !isPasswordValid}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {submitting ? "생성 중..." : "사용자 생성"}
            </Button>
          </div>
        </div>
      </div>
    </DialogBackdrop>
  );
}

// =============================================================================
// 사용자 정보 수정 다이얼로그
// - 이름, 역할, 부서를 변경할 수 있습니다
// - 이메일은 변경 불가 (읽기 전용으로 표시)
// =============================================================================

function EditUserDialog({
  user,
  onClose,
  onSave,
}: {
  user: UserProfile;
  onClose: () => void;
  onSave: (id: string, updates: Record<string, any>) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [department, setDepartment] = useState(user.department || "");
  const [submitting, setSubmitting] = useState(false);

  // 폼 제출 시 부모 컴포넌트의 handleUpdateUser 호출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSave(user.id, { name, role, department: department || null });
    setSubmitting(false);
  };

  return (
    <DialogBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800">사용자 정보 수정</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 이메일은 수정 불가 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">이메일</label>
            <input type="email" value={user.email} disabled className="w-full px-3 py-2 text-xs border border-gray-100 rounded-lg bg-gray-50 text-gray-400" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">역할</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">부서</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onClose}>취소</Button>
            <Button type="submit" size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5" disabled={submitting}>
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {submitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </DialogBackdrop>
  );
}

// =============================================================================
// 사용자 삭제 확인 다이얼로그
// - "DELETE" 텍스트를 직접 입력해야 삭제 버튼이 활성화됩니다 (실수 방지)
// =============================================================================

function DeleteConfirmDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: UserProfile;
  onClose: () => void;
  onConfirm: () => void;
}) {
  // 삭제 확인을 위해 "DELETE" 텍스트를 입력하는 상태
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  };

  return (
    <DialogBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 mb-1">사용자 삭제</h2>
          <p className="text-xs text-gray-500 mb-4">
            <strong>{user.name}</strong> ({user.email}) 계정을 영구 삭제합니다.
            <br />이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="mb-4 text-left">
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              확인을 위해 <strong className="text-red-600">DELETE</strong> 를 입력하세요
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>취소</Button>
            <Button
              size="sm"
              className="text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5"
              disabled={confirmText !== "DELETE" || submitting}
              onClick={handleDelete}
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {submitting ? "삭제 중..." : "삭제 확인"}
            </Button>
          </div>
        </div>
      </div>
    </DialogBackdrop>
  );
}

// =============================================================================
// 비밀번호 변경 다이얼로그
// - Mock 데이터 환경이므로 실제 비밀번호를 변경하지 않습니다
// - 입력값을 검증한 후 성공 토스트 메시지만 표시합니다
// =============================================================================

function PasswordResetDialog({
  user,
  onClose,
}: {
  user: UserProfile;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 비밀번호가 6자 이상이고 확인 비밀번호와 일치해야 유효
  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  // Mock 처리: 실제 변경 없이 성공 메시지만 표시
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      if (newPassword.length < 6) {
        toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      } else {
        toast.error("비밀번호가 일치하지 않습니다.");
      }
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      // Mock 환경: 짧은 지연 후 성공 처리 (실제 서버 요청 없음)
      await new Promise((r) => setTimeout(r, 400));
      toast.success(`${user.name} (${user.email})의 비밀번호가 변경되었습니다. (Mock)`);
      onClose();
    } catch (err: any) {
      console.error("[PasswordReset] Error:", err);
      toast.error(`비밀번호 변경 실패: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogBackdrop onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-violet-600" />
            <h2 className="text-sm font-bold text-slate-800">비밀번호 변경</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 대상 사용자 정보 표시 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>
            {/* Mock 환경에서는 모든 사용자가 auth 미연결 상태 */}
            <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold border border-blue-200 shrink-0">
              Mock 모드
            </span>
          </div>

          {/* Mock 안내 메시지 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-[11px] text-blue-700 leading-relaxed">
              <strong>안내:</strong> 현재 Mock 데이터 모드로 운영 중입니다.
              비밀번호 변경은 기록되지 않으며, 확인 후 성공 처리됩니다.
            </p>
          </div>

          {/* 새 비밀번호 입력 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">새 비밀번호 *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="최소 6자"
                minLength={6}
                className="w-full px-3 py-2 pr-16 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded"
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-[10px] text-red-500 mt-1">최소 6자 이상 입력하세요</p>
            )}
          </div>

          {/* 비밀번호 확인 입력 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">비밀번호 확인 *</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 다시 입력"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[10px] text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>

          {/* 취소/변경 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onClose}>취소</Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
              disabled={!isValid || submitting}
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              {submitting ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </div>
        </form>
      </div>
    </DialogBackdrop>
  );
}

// =============================================================================
// 공통 다이얼로그 배경 컴포넌트
// - 반투명 검정 오버레이를 깔고, 바깥 클릭 시 다이얼로그를 닫습니다
// =============================================================================

function DialogBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이: 클릭하면 닫기 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* 다이얼로그 콘텐츠: 클릭 이벤트가 배경으로 전달되지 않도록 차단 */}
      <div className="relative z-10" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
