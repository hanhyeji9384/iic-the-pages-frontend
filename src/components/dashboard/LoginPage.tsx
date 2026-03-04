import React, { useState } from "react";
import { supabase } from "../../utils/supabase/client";
import { createClient } from "@supabase/supabase-js";
import {
  projectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import {
  Lock,
  Mail,
  Loader2,
  Info,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  Settings,
} from "lucide-react";
import { titleLogo } from "../../utils/brand-assets";

interface LoginPageProps {
  onLoginSuccess: (opts?: {
    mustChangePassword?: boolean;
  }) => void;
}

/**
 * Create an isolated Supabase client that won't overwrite the main session.
 */
function getIsolatedClient() {
  return createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: `sb-isolated-login-${Date.now()}`,
      },
    },
  );
}

/**
 * Diagnose why "Invalid login credentials" is happening.
 * Supabase returns this generic error for BOTH:
 *   - User doesn't exist
 *   - User exists but email is unconfirmed (security: anti-enumeration)
 *   - Wrong password
 *
 * We probe with signUp() on an isolated client to distinguish these cases.
 */
async function diagnoseLoginFailure(
  email: string,
  password: string,
): Promise<{
  cause:
    | "not_exists"
    | "email_unconfirmed"
    | "wrong_password"
    | "signup_disabled"
    | "unknown";
  detail: string;
  autoCreated?: boolean;
}> {
  try {
    const isolated = getIsolatedClient();
    console.log(
      "[Diagnose] Probing account existence via signUp:",
      email,
    );

    const { data, error } = await isolated.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: email.split("@")[0] } },
    });

    if (error) {
      const errLower = error.message.toLowerCase();

      // Signups disabled at project level
      if (
        errLower.includes("signups not allowed") ||
        (errLower.includes("signup") &&
          errLower.includes("not allowed"))
      ) {
        console.log(
          "[Diagnose] Signups are disabled for this Supabase instance.",
        );
        return {
          cause: "signup_disabled",
          detail:
            "Supabase 프로젝트에서 회원가입이 비활성화되어 있습니다.",
        };
      }

      // If signUp says "already registered" → account exists → wrong password or unconfirmed
      if (
        errLower.includes("already") ||
        errLower.includes("registered") ||
        errLower.includes("exists")
      ) {
        console.log(
          "[Diagnose] Account exists (signUp rejected). Likely email unconfirmed or wrong password.",
        );
        return {
          cause: "email_unconfirmed",
          detail:
            "계정은 존재하지만 이메일 인증이 완료되지 않았거나 비밀번호가 다릅니다.",
        };
      }
      console.log("[Diagnose] signUp error:", error.message);
      return { cause: "unknown", detail: error.message };
    }

    // signUp succeeded
    if (data?.user) {
      // Empty identities = anti-enumeration: user already exists
      if (
        !data.user.identities ||
        data.user.identities.length === 0
      ) {
        console.log(
          "[Diagnose] signUp returned empty identities → user exists, likely unconfirmed.",
        );
        return {
          cause: "email_unconfirmed",
          detail:
            "계정이 존재하지만 이메일 인증이 완료되지 않았을 수 있습니다.",
        };
      }

      // User was freshly created
      console.log(
        "[Diagnose] New user created via signUp:",
        data.user.id,
      );

      // Check if email was auto-confirmed (Confirm email OFF in settings)
      if (data.user.email_confirmed_at || data.session) {
        return {
          cause: "not_exists",
          detail:
            "계정이 새로 생성되었습니다. 자동 로그인을 시도합니다.",
          autoCreated: true,
        };
      } else {
        // Created but not confirmed → Confirm email is ON
        return {
          cause: "not_exists",
          detail:
            "계정이 생성되었지만 이메일 인증이 필요합니다.",
          autoCreated: true,
        };
      }
    }

    return { cause: "unknown", detail: "알 수 없는 상태" };
  } catch (e: any) {
    console.error("[Diagnose] Error:", e);
    return { cause: "unknown", detail: e.message };
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [diagnosisInfo, setDiagnosisInfo] = useState<
    string | null
  >(null);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(
    null,
  );

  const clearMessages = () => {
    setError(null);
    setDiagnosisInfo(null);
    setShowHint(false);
    setStatusMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    const trimmedEmail = email.trim();

    try {
      // ── Step 1: Try normal login ──
      console.log(
        "[Login] Step 1: signInWithPassword for:",
        trimmedEmail,
      );
      setStatusMsg("로그인 시도 중...");

      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

      if (!authError && data?.session) {
        console.log("[Login] Success on first attempt!");
        setStatusMsg(null);
        const user = data.session.user;
        const mustChange = detectMustChangePassword(user);
        onLoginSuccess({ mustChangePassword: mustChange });
        return;
      }

      if (authError) {
        console.warn(
          "[Login] First attempt failed:",
          authError.message,
          "status:",
          authError.status,
        );
        const errLower = authError.message?.toLowerCase() || "";

        // Explicit "email not confirmed" — show direct instructions
        if (errLower.includes("email not confirmed")) {
          setError(null);
          setDiagnosisInfo(
            "이메일 인증이 완료되지 않아 로그인할 수 없습니다.\n\n" +
              "Supabase Dashboard에서 해결하세요:\n" +
              "  Authentication → Sign In / Providers\n" +
              "  → Email 항목 클릭(확장) → 'Confirm email' 토글 OFF → Save\n\n" +
              "설정 변경 후 다시 로그인하세요.",
          );
          return;
        }

        // "Invalid login credentials" — need diagnosis
        if (
          errLower.includes("invalid login credentials") ||
          errLower.includes("invalid")
        ) {
          // ── Step 2: Diagnose the cause ──
          console.log(
            "[Login] Step 2: Diagnosing cause of failure...",
          );
          setStatusMsg("계정 상태 확인 중...");

          const diagnosis = await diagnoseLoginFailure(
            trimmedEmail,
            password,
          );
          console.log("[Login] Diagnosis result:", diagnosis);

          if (diagnosis.autoCreated) {
            // Account was just created via signUp probe
            // ── Step 3: Try login again ──
            console.log(
              "[Login] Step 3: Account auto-created, retrying login...",
            );
            setStatusMsg("계정 생성됨, 재로그인 시도 중...");
            await new Promise((r) => setTimeout(r, 800));

            const { data: retryData, error: retryError } =
              await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
              });

            if (!retryError && retryData?.session) {
              console.log(
                "[Login] Auto-login after account creation succeeded!",
              );
              setStatusMsg(null);
              // Auto-created account → always force password change
              onLoginSuccess({ mustChangePassword: true });
              return;
            }

            if (retryError) {
              const retryErrLower =
                retryError.message?.toLowerCase() || "";
              console.warn(
                "[Login] Retry login failed:",
                retryError.message,
              );

              if (
                retryErrLower.includes("email not confirmed") ||
                retryErrLower.includes(
                  "invalid login credentials",
                ) ||
                retryErrLower.includes("invalid")
              ) {
                // The issue is "Confirm email" is ON
                setError(null);
                setDiagnosisInfo(
                  "계정이 자동 생성되었지만, Supabase의 'Confirm email' 설정이\n" +
                    "활성화되어 있어 즉시 로그인할 수 없습니다.\n\n" +
                    "Supabase Dashboard에서 설정을 변경하세요:\n\n" +
                    "  1. Authentication 메뉴 클릭\n" +
                    "  2. Sign In / Providers → Email 항목 클릭(확장)\n" +
                    "  3. 'Confirm email' 토글을 OFF로 전환\n" +
                    "  4. Save 버튼 클릭\n\n" +
                    "설정 변경 후 같은 이메일/비밀번호로 다시 로그인하세요.",
                );
                return;
              }

              setError(
                `계정 생성 후 로그인 실패: ${retryError.message}`,
              );
              return;
            }
          }

          // Account exists but we couldn't create a new one → wrong password or unconfirmed
          if (diagnosis.cause === "email_unconfirmed") {
            setError(null);
            setDiagnosisInfo(
              "이 이메일로 계정이 존재하지만 로그인에 실패했습니다.\n\n" +
                "가능한 원인:\n" +
                "  • 비밀번호가 일치하지 않음\n" +
                "  • 이메일 인증이 완료되지 않음 (Supabase 'Confirm email' 활성 시)\n\n" +
                "해결 방법:\n" +
                "  1. 비밀번호를 다시 확인하세요\n" +
                "  2. Supabase Dashboard → Authentication\n" +
                "     → Sign In / Providers → Email 항목 클릭(확장)\n" +
                "     → 'Confirm email' OFF → Save\n" +
                "  3. 또는 Authentication → Users에서 해당 이메일 수동 확인",
            );
            setShowHint(true);
            return;
          }

          // Signups disabled — can't auto-create, guide user to Dashboard
          if (diagnosis.cause === "signup_disabled") {
            setError(null);
            setDiagnosisInfo(
              "로그인에 실패했고, 회원가입이 비활성화되어 자동 계정 생성이 불가합니다.\n\n" +
                "아래 2가지 설정을 확인하세요:\n\n" +
                "① 사용자 직접 생성 (Authentication → Users)\n" +
                "  • 'Add user' → 'Create new user' 클릭\n" +
                "  • Email / Password 입력 후 'Auto Confirm User' 체크\n" +
                "  • 'Create user' 클릭\n\n" +
                "② 또는 회원가입 허용 (Authentication → Sign In / Providers)\n" +
                "  • Email 항목 클릭(확장)\n" +
                "  • 'Allow new users to sign up' 토글 ON\n" +
                "  • 'Confirm email' 토글 OFF\n" +
                "  • Save 클릭\n\n" +
                "설정 완료 후 같은 이메일/비밀번호로 다시 로그인하세요.",
            );
            return;
          }

          if (diagnosis.cause === "wrong_password") {
            setError("비밀번호가 일치하지 않습니다.");
            setShowHint(true);
            return;
          }

          // Unknown cause
          setError(`로그인 실패: ${authError.message}`);
          setDiagnosisInfo(`진단 결과: ${diagnosis.detail}`);
          return;
        }

        // Other error types
        setError(`로그인 실패: ${authError.message}`);
        return;
      }
    } catch (err: any) {
      console.error("[Login] Unexpected error:", err);
      setError(`로그인 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
      setStatusMsg(null);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-[420px] mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
            src={titleLogo}
            alt="THE PAGES"
            className="h-[32px] min-[2560px]:h-[42px] w-auto opacity-80"
          />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearMessages();
                  }}
                  placeholder=""
                  required
                  autoComplete="email"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 
                    focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearMessages();
                  }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 
                    focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Status Message (progress) */}
            {statusMsg && (
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2.5 border border-red-100 whitespace-pre-line leading-relaxed">
                {error}
              </div>
            )}

            {/* Diagnosis Info (amber — actionable guidance) */}
            {diagnosisInfo && (
              <div className="text-[11px] text-amber-800 bg-amber-50 rounded-lg px-3.5 py-3 border border-amber-200 whitespace-pre-line leading-relaxed">
                <div className="flex items-start gap-2">
                  <Settings className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-700 mb-1.5 text-[12px]">
                      설정 변경이 필요합니다
                    </p>
                    {diagnosisInfo}
                  </div>
                </div>
              </div>
            )}

            {/* Initial Password Hint */}
            {showHint && (
              <div className="flex items-start gap-2 text-[11px] text-blue-600 bg-blue-50 rounded-lg px-3 py-2.5 border border-blue-100">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-semibold mb-0.5">
                    초기 비밀번호 확인
                  </p>
                  <p className="text-blue-500">
                    관리자가 생성한 계정의 초기 비밀번호는{" "}
                    <code className="bg-blue-100 px-1 py-0.5 rounded text-[10px] font-mono">
                      이메일아이디!@
                    </code>{" "}
                    형식입니다.
                    <br />
                    예:{" "}
                    <code className="bg-blue-100 px-1 py-0.5 rounded text-[10px] font-mono">
                      admin@uli.com
                    </code>
                    {" → "}
                    <code className="bg-blue-100 px-1 py-0.5 rounded text-[10px] font-mono">
                      admin!@
                    </code>
                  </p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 
                text-white text-[14px] font-medium rounded-lg 
                transition-all duration-200 
                flex items-center justify-center gap-2
                cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Help text */}
          <p className="text-[10px] text-gray-300 text-center mt-4 leading-relaxed">
            계정이 없으면 이메일/비밀번호 입력 후 Login 클릭 시
            자동 생성됩니다
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

/**
 * Detect if the user must change their password.
 * Works WITHOUT Edge Functions by using user_metadata instead of app_metadata.
 *
 * Logic:
 *   1. If app_metadata.must_change_password === true → force change (legacy Edge Function path)
 *   2. If user_metadata.password_changed === true → already changed, skip
 *   3. Otherwise → first login, must change password
 */
function detectMustChangePassword(user: any): boolean {
  if (!user) return false;

  // Legacy: Edge Function set this via admin.createUser
  if (user.app_metadata?.must_change_password === true) {
    console.log(
      "[Login] must_change_password flag found in app_metadata",
    );
    return true;
  }

  // If user already changed their password (marked in user_metadata)
  if (user.user_metadata?.password_changed === true) {
    console.log(
      "[Login] password_changed=true in user_metadata → skip force change",
    );
    return false;
  }

  // First login: user_metadata.password_changed is not set → force change
  console.log(
    "[Login] No password_changed flag → treating as first login, force password change",
  );
  return true;
}