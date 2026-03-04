// ============================================================
// ForcePasswordChange — Mock 비밀번호 변경 페이지
// Supabase 제거됨. 비밀번호 변경 UI만 유지하고 실제 서버 호출 없이 처리합니다.
// ============================================================

import React, { useState } from "react";
import { KeyRound, Lock, Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { titleLogo } from "../../utils/brand-assets";
import { toast } from "sonner";

interface ForcePasswordChangeProps {
  userEmail: string;
  onPasswordChanged: () => void;
}

export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({
  userEmail,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    // Mock: 짧은 지연 후 성공 처리
    await new Promise((r) => setTimeout(r, 500));

    setIsLoading(false);
    toast.success("비밀번호가 성공적으로 변경되었습니다.");
    onPasswordChanged();
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-[440px] mx-4">
        {/* 로고 */}
        <div className="flex justify-center mb-8">
          <img
            src={titleLogo}
            alt="THE PAGES"
            className="h-[32px] min-[2560px]:h-[42px] w-auto opacity-80"
          />
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          {/* 경고 배너 */}
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-amber-800">
                초기 비밀번호로 로그인하셨습니다
              </p>
              <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">
                안전한 사용을 위해 새 비밀번호로 변경해 주세요.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* 현재 사용자 정보 */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userEmail?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-gray-500">로그인 계정</p>
                <p className="text-[13px] font-medium text-slate-700 truncate">{userEmail}</p>
              </div>
            </div>

            {/* 새 비밀번호 */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="최소 6자 이상"
                  required
                  minLength={6}
                  autoFocus
                  className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300
                    transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-[11px] text-red-500">최소 6자 이상 입력하세요</p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="비밀번호 다시 입력"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300
                    transition-all duration-200"
                />
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-500">비밀번호가 일치하지 않습니다</p>
              )}
              {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 6 && (
                <p className="text-[11px] text-green-600">비밀번호가 일치합니다</p>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                {error}
              </p>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300
                text-white text-[14px] font-medium rounded-lg
                transition-all duration-200
                flex items-center justify-center gap-2
                cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>변경 중...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>비밀번호 변경</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* 하단 문구 */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          비밀번호 변경 후 대시보드에 접근할 수 있습니다
        </p>
      </div>
    </div>
  );
};
