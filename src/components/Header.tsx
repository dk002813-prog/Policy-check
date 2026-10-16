import React from 'react';
import { Compass, Sparkles, MapPin, Briefcase, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onResetPreset: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  eligibleCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onResetPreset,
  onRefresh,
  isLoading,
  eligibleCount,
  totalCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* 로고 & 타이틀 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Compass className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  정책 탐색기
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <MapPin className="w-3 h-3" />
                  대구 청년 맞춤
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                온통청년 공공데이터 기반 청년정책 자격 판정기
              </p>
            </div>
          </div>

          {/* 우측 도구: 대구 30대 취준생 프리셋 & 통계 배지 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>나에게 맞는 정책</span>
                <span className="font-bold text-blue-600 text-sm">
                  {eligibleCount}
                </span>
                <span className="text-slate-400">/ {totalCount}건</span>
              </div>
            </div>

            <button
              onClick={onResetPreset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
              title="대구 거주 30대 취업준비생 추천 조건으로 즉시 설정"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span className="hidden xs:inline">대구 30대 취준생</span> 빠른설정
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              title="정책 데이터 새로고침"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
