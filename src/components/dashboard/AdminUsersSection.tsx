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
import { supabase } from "../../utils/supabase/client";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  auth_id: string | null;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type RoleBadge = "admin" | "editor" | "viewer";

const ROLE_CONFIG: Record<RoleBadge, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  admin:  { label: "Admin",  color: "text-red-700",    bg: "bg-red-50 border-red-200",    icon: Shield },
  editor: { label: "Editor", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200", icon: Pencil },
  viewer: { label: "Viewer", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   icon: Eye },
};

// ─── Helper ──────────────────────────────────────────────────────────────────

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ed83bf0f`;

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || publicAnonKey;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const AdminUsersSection: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<UserProfile | null>(null);
  const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);

  // ─── Data Fetching (Direct Supabase RDB Query) ──────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message?.includes("relation") || error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("[AdminUsers] public.users table does not exist yet");
          setTableExists(false);
          setUsers([]);
          return;
        }
        throw new Error(error.message);
      }
      setTableExists(true);
      setUsers(data || []);
    } catch (e: any) {
      console.error("[AdminUsers] Fetch error:", e);
      toast.error(`사용자 목록 로딩 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Filtered Users ─────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
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

  // ─── Actions (All Direct Supabase Client — no Edge Function) ────────────

  const handleToggleActive = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
      toast.success(`${user.name} 계정이 ${user.is_active ? "비활성화" : "활성화"}되었습니다.`);
      fetchUsers();
    } catch (e: any) {
      toast.error(`상태 변경 실패: ${e.message}`);
    }
    setActionMenuUser(null);
  };

  const handleRoleChange = async (user: UserProfile, newRole: string) => {
    if (newRole === user.role) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
      toast.success(`${user.name}의 역할이 ${newRole}(으)로 변경되었습니다.`);
      fetchUsers();
    } catch (e: any) {
      toast.error(`역할 변경 실패: ${e.message}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      // Delete from public.users table directly
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", deletingUser.id);
      if (error) throw new Error(error.message);
      toast.success(`${deletingUser.name} 계정이 삭제되었습니다.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (e: any) {
      console.error("[AdminUsers] Delete error:", e);
      toast.error(`삭제 실패: ${e.message}`);
    }
  };

  const handleUpdateUser = async (id: string, updates: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
      toast.success("사용자 정보가 수정되었습니다.");
      setEditingUser(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(`수정 실패: ${e.message}`);
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────

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
      {/* Header */}
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

      {/* Stats Bar */}
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

      {/* Filters Bar */}
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

      {/* Users Table */}
      <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : !tableExists ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">public.users 테이블이 존재하지 않습니다</p>
            <p className="text-xs text-gray-400 text-center max-w-md leading-relaxed">
              Supabase SQL Editor에서{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">supabase-database-guide.sql</code>의
              CREATE TABLE users 구문을 실행한 후 새로고침하세요.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 mt-4"
              onClick={fetchUsers}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              다시 확인
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="w-10 h-10 mb-2 text-gray-200" />
            <p className="text-sm font-medium">
              {users.length === 0 ? "등록된 사용자가 없습니다" : "검색 결과가 없습니다"}
            </p>
            {users.length === 0 && (
              <p className="text-xs mt-1">
                <code className="bg-gray-100 px-1.5 py-0.5 rounded">public.users</code> 테이블이 생성되었는지 확인하세요.
              </p>
            )}
          </div>
        ) : (
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-gray-700 font-medium truncate">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{user.name}</td>
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
                    <td className="px-4 py-3 text-gray-500">{user.department || "—"}</td>
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
                    <td className="px-4 py-3 text-gray-400">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenuUser(actionMenuUser === user.id ? null : user.id)}
                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                        {actionMenuUser === user.id && (
                          <>
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

      {/* Dialogs */}
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
// Add User Dialog — Edge Function (email_confirm:true), fallback to signUp()
// =============================================================================

function AddUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-generated password: email prefix + "!@"
  const emailPrefix = email.split("@")[0];
  const generatedPassword = emailPrefix ? `${emailPrefix}!@` : "";
  const isPasswordValid = generatedPassword.length >= 6;

  /**
   * Create a throwaway Supabase client for signUp so we don't
   * overwrite the current admin session.
   * Uses a unique storageKey to avoid "Multiple GoTrueClient" warnings.
   */
  const getIsolatedClient = () =>
    createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: `sb-isolated-adduser-${Date.now()}`,
      },
    });

  /**
   * Ensure a public.users profile row exists for the given auth user.
   */
  const ensureProfile = async (authId: string | null, userEmail: string, userName: string) => {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("users")
        .update({
          auth_id: authId || existing.id,
          name: userName,
          role: role || "viewer",
          department: department || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("email", userEmail);
      if (error) console.warn("[AddUser] Profile update warning:", error.message);
      return;
    }

    const { error } = await supabase.from("users").insert({
      auth_id: authId,
      email: userEmail,
      name: userName,
      role: role || "viewer",
      department: department || null,
      is_active: true,
    });
    if (error) console.warn("[AddUser] Profile insert warning:", error.message);
  };

  /**
   * Try to confirm email via Edge Function (uses service_role_key).
   * Returns true if confirmed successfully.
   */
  const tryConfirmEmail = async (userEmail: string): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${SERVER_BASE}/confirm-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (res.ok) {
        console.log("[AddUser] Email confirmed via Edge Function for:", userEmail);
        return true;
      }
      const data = await res.json().catch(() => ({}));
      console.warn("[AddUser] confirm-email returned:", res.status, data);
      return false;
    } catch (e: any) {
      console.warn("[AddUser] confirm-email endpoint unreachable:", e.message);
      return false;
    }
  };

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
      // ── Strategy 1: Edge Function /signup (uses admin.createUser + email_confirm) ──
      let edgeFnSuccess = false;
      try {
        const token = await getAccessToken();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(`${SERVER_BASE}/signup`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password: generatedPassword, name, role, department: department || null }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        let data: any;
        try { data = await res.json(); } catch { data = {}; }

        if (res.ok) {
          edgeFnSuccess = true;
          console.log("[AddUser] Edge Function success:", data);
          toast.success(
            `${name} (${email}) 계정이 생성되었습니다.\n초기 비밀번호: ${generatedPassword}\n최초 로그인 시 비밀번호 변경이 필요합니다.`,
            { duration: 8000 }
          );
          onCreated();
          return;
        } else {
          console.warn("[AddUser] Edge Function returned error:", res.status, data);
          const errMsg = (data.error || "").toLowerCase();
          if (errMsg.includes("already") || errMsg.includes("registered") || errMsg.includes("exists")) {
            console.log("[AddUser] User already exists in auth — ensuring profile is linked.");
            // Also try to confirm their email in case it was previously unconfirmed
            await tryConfirmEmail(email);
            await ensureProfile(null, email, name);
            toast.success(`${name} (${email}) 기존 계정에 프로필이 연결되었습니다.`);
            onCreated();
            edgeFnSuccess = true;
            return;
          }
          throw new Error(data.error || `HTTP ${res.status}`);
        }
      } catch (edgeErr: any) {
        if (edgeFnSuccess) return;
        console.warn("[AddUser] Edge Function unavailable, falling back to signUp():", edgeErr.message);
      }

      // ── Strategy 2: Fallback — isolated supabase.auth.signUp() ──
      // Use a throwaway client so we don't replace the admin's session.
      console.log("[AddUser] Fallback: creating user via isolated signUp:", email);
      const isolated = getIsolatedClient();
      const { data: authData, error: authError } = await isolated.auth.signUp({
        email,
        password: generatedPassword,
        options: { data: { name } },
      });

      if (authError) {
        const errMsg = authError.message.toLowerCase();
        if (errMsg.includes("already") || errMsg.includes("registered") || errMsg.includes("exists")) {
          console.log("[AddUser] User already registered — ensuring profile is linked.");
          await tryConfirmEmail(email);
          await ensureProfile(null, email, name);
          toast.success(`${name} (${email}) 기존 계정에 프로필이 연결되었습니다.`);
          onCreated();
          return;
        }
        // Signups disabled — provide actionable guidance
        if (errMsg.includes("signups not allowed") || (errMsg.includes("signup") && errMsg.includes("not allowed"))) {
          // Still save profile to public.users (without auth_id)
          await ensureProfile(null, email, name);
          toast.error(
            `Auth 계정을 생성할 수 없습니다 (회원가입 비활성화 상태).\n\n` +
            `프로필만 public.users에 저장되었습니다.\n` +
            `Auth 계정은 Supabase Dashboard에서 생성하세요:\n` +
            `Authentication → Users → Add user → Create new user\n` +
            `(Email: ${email}, Auto Confirm User 체크)`,
            { duration: 15000 }
          );
          onCreated();
          return;
        }
        throw new Error(authError.message);
      }

      // Supabase may return a user with empty identities[] if the email
      // is already taken (anti-enumeration). Treat it as "already exists".
      if (authData.user && (!authData.user.identities || authData.user.identities.length === 0)) {
        console.log("[AddUser] signUp returned empty identities — user likely already exists.");
        await tryConfirmEmail(email);
        await ensureProfile(null, email, name);
        toast.success(`${name} (${email}) 기존 계정에 프로필이 연결되었습니다.`);
        onCreated();
        return;
      }

      // Auth user created — ensure profile
      const userId = authData.user?.id || null;
      await ensureProfile(userId, email, name);

      // Try to auto-confirm email via Edge Function so the user can log in immediately
      const isAlreadyConfirmed = authData.user?.email_confirmed_at || authData.session;
      if (!isAlreadyConfirmed) {
        const confirmed = await tryConfirmEmail(email);
        if (confirmed) {
          toast.success(
            `${name} (${email}) 계정이 생성되었습니다.\n초기 비밀번호: ${generatedPassword}`,
            { duration: 8000 }
          );
        } else {
          toast.error(
            `${name} (${email}) 계정이 생성되었지만, 이메일 인증에 실패했습니다.\n` +
            `Edge Function이 응답하지 않아 이 사용자는 로그인할 수 없습니다.\n` +
            `Supabase 대시보드 → Authentication → Users에서 이메일을 수동 확인하거나,\n` +
            `Edge Function 배포 후 다시 시도하세요.`,
            { duration: 12000 }
          );
        }
      } else {
        toast.success(
          `${name} (${email}) 계정이 생성되었습니다.\n초기 비밀번호: ${generatedPassword}`,
          { duration: 8000 }
        );
      }
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

          {/* Auto-generated password preview */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">초기 비밀번호 (자동 생성)</label>
            <div className="w-full px-3 py-2 text-xs border border-gray-100 rounded-lg bg-gray-50 text-gray-500 font-mono tracking-wide">
              {generatedPassword || <span className="text-gray-300 font-sans">이메일을 입력하면 자동 생성됩니다</span>}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              규칙: 이메일 아이디 + <code className="bg-gray-100 px-1 rounded">!@</code> &nbsp;
              {generatedPassword && !isPasswordValid && (
                <span className="text-red-500">(이메일 아이디가 너무 짧습니다 — 최소 4자 필요)</span>
              )}
              {generatedPassword && isPasswordValid && (
                <span className="text-green-600">— 최초 로그인 시 변경 필수</span>
              )}
            </p>
          </div>

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
// Edit User Dialog
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
// Delete Confirm Dialog
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
// Password Reset Dialog
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

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

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
      // Call Edge Function — uses service_role_key via auth.admin.updateUserById()
      const token = await getAccessToken();
      const res = await fetch(`${SERVER_BASE}/admin/users/${user.id}/reset-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      let data: any;
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok) {
        const errMsg = data.error || `HTTP ${res.status}`;
        console.error("[PasswordReset] Server error:", res.status, data);
        throw new Error(errMsg);
      }

      console.log("[PasswordReset] Success:", data);
      toast.success(`${user.name} (${user.email})의 비밀번호가 변경되었습니다.`);
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
          {/* Target user info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>
            {!user.auth_id && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200 shrink-0">
                auth 미연결
              </span>
            )}
          </div>

          {!user.auth_id && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[11px] text-amber-700 leading-relaxed">
                <strong>주의:</strong> 이 사용자는 auth_id가 연결되어 있지 않아 비밀번호를 변경할 수 없습니다.
                먼저 사용자를 Auth 시스템에 등록해 주세요.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">새 비밀번호 *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="최소 6자"
                minLength={6}
                disabled={!user.auth_id}
                className="w-full px-3 py-2 pr-16 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 disabled:bg-gray-50 disabled:text-gray-300"
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

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">비밀번호 확인 *</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 다시 입력"
              disabled={!user.auth_id}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 disabled:bg-gray-50 disabled:text-gray-300"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[10px] text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onClose}>취소</Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
              disabled={!isValid || submitting || !user.auth_id}
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
// Shared Backdrop
// =============================================================================

function DialogBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}