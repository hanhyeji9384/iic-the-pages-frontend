// ============================================================
// LoginPage — Mock 로그인 페이지
// Supabase 제거됨. 간단한 이메일/비밀번호 입력 후 바로 로그인 처리합니다.
// 비전공자 설명: 실제 인증 없이 로그인 화면만 보여주고,
// 아무 이메일/비밀번호로든 로그인할 수 있는 데모 버전입니다.
// ============================================================

import React, { useState } from "react";
import {
  Lock,
  Mail,
  Loader2,
} from "lucide-react";
import { titleLogo } from "../../utils/brand-assets";

interface LoginPageProps {
  onLoginSuccess: (opts?: {
    mustChangePassword?: boolean;
  }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock 로그인: 짧은 지연 후 바로 성공 처리
    await new Promise((r) => setTimeout(r, 500));

    setIsLoading(false);
    onLoginSuccess({ mustChangePassword: false });
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-[420px] mx-4">
        {/* 로고 */}
        <div className="flex justify-center mb-10">
          <img
            src={titleLogo}
            alt="THE PAGES"
            className="h-[32px] min-[2560px]:h-[42px] w-auto opacity-80"
          />
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 입력 */}
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
                  onChange={(e) => setEmail(e.target.value)}
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

            {/* 비밀번호 입력 */}
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* 로그인 버튼 */}
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

          {/* 안내 문구 */}
          <p className="text-[10px] text-gray-300 text-center mt-4 leading-relaxed">
            Demo 모드 — 아무 이메일/비밀번호로 로그인 가능
          </p>
        </div>

        {/* 하단 문구 */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};
