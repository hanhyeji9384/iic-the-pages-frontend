// ============================================================
// PipelineList - 파이프라인 리스트 테이블
// 모든 매장을 표 형태로 보여주며 다양한 필터로 검색할 수 있습니다.
// ============================================================

import React, { useMemo, useState } from 'react';
import { Store, PIPELINE_STATUS_COLORS, getStoreClass, isIICBrand } from '../../types';
import { Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';

// 각 컬럼의 정렬 방향
type SortDirection = 'asc' | 'desc' | null;

// 정렬 가능한 컬럼 키
type SortKey = 'name' | 'brand' | 'type' | 'status' | 'country' | 'openDate';

interface PipelineListProps {
  stores: Store[];
  /** 초기 상태 필터 (ProgressBoard에서 클릭해서 진입할 때) */
  initialStatus?: string;
  /** 초기 브랜드 필터 */
  initialBrand?: string;
  /** 초기 연도 필터 */
  initialYears?: number[];
  /** 초기 국가/지역 필터 */
  initialCountryRegion?: string;
  /** 초기 매장 분류 필터 */
  initialClass?: string;
  /** 매장 클릭 시 콜백 */
  onStoreClick?: (store: Store) => void;
  /** 국가 클릭 시 콜백 */
  onCountryClick?: (countryRegion: string) => void;
}

// 파이프라인 상태 정규화 (구 상태명 → 신 상태명)
function normalizeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    Plan: 'Planned',
    Confirm: 'Confirmed',
    Contract: 'Signed',
    Space: 'Construction',
    Planed: 'Planned',
  };
  return statusMap[status] || status;
}

export const PipelineList: React.FC<PipelineListProps> = ({
  stores,
  initialStatus,
  initialBrand,
  onStoreClick,
}) => {
  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState('');

  // 상태 필터 상태 (초기값: 외부에서 받거나 전체)
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatus || '전체'
  );

  // 브랜드 필터 상태
  const [brandFilter, setBrandFilter] = useState<string>(
    initialBrand || '전체'
  );

  // 정렬 상태
  const [sortKey, setSortKey] = useState<SortKey>('openDate');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // IIC 매장만 필터링
  const iicStores = useMemo(() => {
    return stores.filter(
      (s) => isIICBrand(s.brand) || s.brandCategory === 'iic'
    );
  }, [stores]);

  // 사용 가능한 상태 목록
  const availableStatuses = [
    '전체',
    'Open',
    'Construction',
    'Signed',
    'Confirmed',
    'Planned',
  ];

  // 사용 가능한 브랜드 목록
  const availableBrands = [
    '전체',
    'Gentle Monster',
    'Tamburins',
    'Nudake',
    'Atiissu',
    'Nuflaat',
  ];

  // 필터링 + 검색 + 정렬 적용
  const filteredStores = useMemo(() => {
    let result = iicStores;

    // 검색어 필터
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q) ||
          s.location.city.toLowerCase().includes(q) ||
          s.location.country.toLowerCase().includes(q)
      );
    }

    // 상태 필터
    if (statusFilter !== '전체') {
      result = result.filter(
        (s) => normalizeStatus(s.status) === statusFilter
      );
    }

    // 브랜드 필터
    if (brandFilter !== '전체') {
      result = result.filter((s) => s.brand === brandFilter);
    }

    // 정렬
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        switch (sortKey) {
          case 'name':
            valA = a.name;
            valB = b.name;
            break;
          case 'brand':
            valA = a.brand;
            valB = b.brand;
            break;
          case 'type':
            valA = a.type;
            valB = b.type;
            break;
          case 'status':
            valA = normalizeStatus(a.status);
            valB = normalizeStatus(b.status);
            break;
          case 'country':
            valA = a.location.country;
            valB = b.location.country;
            break;
          case 'openDate':
            valA = a.openDate || '';
            valB = b.openDate || '';
            break;
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [iicStores, searchQuery, statusFilter, brandFilter, sortKey, sortDir]);

  // 컬럼 헤더 클릭 시 정렬 방향 전환
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // 정렬 아이콘 렌더링
  const SortIcon: React.FC<{ column: SortKey }> = ({ column }) => {
    if (sortKey !== column) {
      return <ChevronDown className="w-3 h-3 text-gray-300" />;
    }
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-blue-500" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-500" />
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fb]">
      {/* ───── 필터 바 ───── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center space-x-4 shrink-0">
        {/* 검색창 */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="매장명, 국가, 도시 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>

        {/* 상태 필터 탭 */}
        <div className="flex items-center space-x-1">
          <Filter className="w-4 h-4 text-gray-400 mr-1" />
          {availableStatuses.map((status) => {
            const color = PIPELINE_STATUS_COLORS[status];
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === status
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                style={
                  statusFilter === status && color
                    ? { backgroundColor: color }
                    : undefined
                }
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* 브랜드 필터 */}
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          {availableBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        {/* 결과 카운트 */}
        <span className="text-xs text-gray-400 ml-auto">
          {filteredStores.length}개 매장
        </span>
      </div>

      {/* ───── 테이블 ───── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          {/* 테이블 헤더 */}
          <thead className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {/* 각 컬럼 헤더 */}
              {[
                { key: 'name' as SortKey, label: '매장명' },
                { key: 'brand' as SortKey, label: '브랜드' },
                { key: 'type' as SortKey, label: '채널' },
                { key: 'status' as SortKey, label: '상태' },
                { key: 'country' as SortKey, label: '국가/도시' },
                { key: 'openDate' as SortKey, label: '오픈 날짜' },
              ].map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    <SortIcon column={col.key} />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                면적
              </th>
            </tr>
          </thead>

          {/* 테이블 바디 */}
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredStores.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Search className="w-8 h-8 text-gray-200" />
                    <span className="text-sm">검색 결과가 없습니다.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStores.map((store) => {
                const normalizedStatus = normalizeStatus(store.status);
                const statusColor =
                  PIPELINE_STATUS_COLORS[normalizedStatus] || '#94a3b8';
                const storeClass = getStoreClass(store.type);

                return (
                  <tr
                    key={store.id}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => onStoreClick?.(store)}
                  >
                    {/* 매장명 */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {store.name}
                      </span>
                    </td>

                    {/* 브랜드 */}
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{store.brand}</span>
                    </td>

                    {/* 채널 + 분류 */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-gray-600">{store.type}</span>
                        {storeClass && (
                          <span className="text-[10px] text-gray-400">
                            {storeClass}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 상태 배지 */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold text-white"
                        style={{ backgroundColor: statusColor }}
                      >
                        {normalizedStatus}
                      </span>
                    </td>

                    {/* 국가/도시 */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-gray-600">
                          {store.location.country}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {store.location.city}
                        </span>
                      </div>
                    </td>

                    {/* 오픈 날짜 */}
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {store.openDate || '-'}
                    </td>

                    {/* 면적 */}
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {store.area ? `${store.area.toLocaleString()}㎡` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
