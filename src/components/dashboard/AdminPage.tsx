import React, { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Store,
  Tag,
  Route,
  Calendar,
  Target,
  Settings,
  Shield,
} from "lucide-react";
import { Button } from "../ui/button";
import { AdminUsersSection } from "./AdminUsersSection";

const ADMIN_TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "stores", label: "Stores", icon: Store },
  { key: "brands", label: "Brands", icon: Tag },
  { key: "pipelines", label: "Pipelines & Zones", icon: Route },
  { key: "schedule", label: "Schedule", icon: Calendar },
  { key: "goals", label: "Goals", icon: Target },
  { key: "system", label: "System", icon: Settings },
] as const;

interface AdminPageProps {
  onBack: () => void;
  userName?: string;
  userRole?: string;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onBack,
  userName = "Admin",
  userRole = "admin",
}) => {
  const [activeTab, setActiveTab] = useState<string>("overview");

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      {/* Side Navigation */}
      <aside className="w-56 min-[2560px]:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-700">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Admin</h2>
              <p className="text-[10px] text-slate-400 leading-tight">
                {userName} · {userRole}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-all duration-150
                  ${
                    isActive
                      ? "bg-slate-800 text-white border-l-2 border-blue-500"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent"
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700">
          <p className="text-[10px] text-slate-500 text-center">
            ULI Admin v1.0 · RDB Mode
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6 min-[2560px]:p-8">
        {activeTab === "overview" && <AdminOverview />}
        {activeTab === "users" && <AdminUsersSection />}
        {activeTab === "stores" && <AdminPlaceholder section="Stores" description="IIC/경쟁사 매장 데이터 일괄 조회, 편집, 삭제" />}
        {activeTab === "brands" && <AdminPlaceholder section="Brands" description="경쟁사/선호 브랜드 리스트 관리" />}
        {activeTab === "pipelines" && <AdminPlaceholder section="Pipelines & Zones" description="지도 오버레이 데이터 관리" />}
        {activeTab === "schedule" && <AdminPlaceholder section="Schedule" description="스케줄 이벤트 관리" />}
        {activeTab === "goals" && <AdminPlaceholder section="Goals" description="브랜드별 연간 확장 목표 관리" />}
        {activeTab === "system" && <AdminPlaceholder section="System" description="시스템 설정, 서버 상태 확인" />}
      </main>
    </div>
  );
};

/* ──────────────────────────────────────────────── */
/* Overview (Phase 1 placeholder with stats cards)  */
/* ──────────────────────────────────────────────── */
function AdminOverview() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl min-[2560px]:text-2xl font-bold text-slate-800">
          Admin Overview
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          데이터 현황 및 시스템 상태를 한눈에 확인할 수 있습니다.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "RDB Tables", value: "14", color: "bg-blue-500" },
          { label: "Active Mode", value: "RDB", color: "bg-emerald-500" },
          { label: "Auth Provider", value: "Mock", color: "bg-violet-500" },
          { label: "Role System", value: "Active", color: "bg-amber-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}
            >
              <span className="text-white text-sm font-bold">{stat.value.charAt(0)}</span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800 leading-tight">
                {stat.value}
              </p>
              <p className="text-[11px] text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          RDB-Only Mode Active
        </h3>
        <p className="text-xs text-blue-700 leading-relaxed">
          모든 데이터는 localStorage 기반 Mock 데이터로 관리됩니다.
          실제 서버 연결 없이 프론트엔드만으로 동작합니다.
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────── */
/* Generic Placeholder for other tabs  */
/* ──────────────────────────────────── */
function AdminPlaceholder({
  section,
  description,
}: {
  section: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
          <Settings className="w-8 h-8 text-gray-300" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-400">{section}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
          <p className="text-xs text-gray-300 mt-3">
            Phase 2에서 구현 예정
          </p>
        </div>
      </div>
    </div>
  );
}