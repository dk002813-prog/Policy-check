import React from 'react';
import { PolicyEvaluation, UserCriteria } from '../types/policy.ts';
import { PolicyCard } from './PolicyCard.tsx';
import {
  Filter,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';

interface PolicyListProps {
  evaluations: PolicyEvaluation[];
  criteria: UserCriteria;
  isLoading: boolean;
  error: string | null;
  onSelectPolicy: (evaluation: PolicyEvaluation) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sortBy: UserCriteria['sortBy']) => void;
  onResetCriteria: () => void;
  onRetry: () => void;
}

const CATEGORIES = ['전체', '일자리', '주거', '교육', '복지문화', '참여권리'];

export const PolicyList: React.FC<PolicyListProps> = ({
  evaluations,
  criteria,
  isLoading,
  error,
  onSelectPolicy,
  onCategoryChange,
  onSortChange,
  onResetCriteria,
  onRetry,
}) => {
  // 1. 카테고리 필터링
  let filtered = evaluations;
  if (criteria.category && criteria.category !== '전체') {
    filtered = filtered.filter(e => e.policy.category === criteria.category);
  }

  // 2. 오직 100% 부합 정책만 보기 필터링
  if (criteria.onlyEligible) {
    filtered = filtered.filter(e => e.isFullyEligible);
  }

  // 3. 정렬 적용
  const sorted = [...filtered].sort((a, b) => {
    if (criteria.sortBy === 'recommend') {
      // 1순위: 적합도 점수 높은 순
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      // 2순위: 마감임박 순 (마감된 것은 뒤로)
      const aD = a.dDay !== null && a.dDay >= 0 ? a.dDay : 9999;
      const bD = b.dDay !== null && b.dDay >= 0 ? b.dDay : 9999;
      return aD - bD;
    }

    if (criteria.sortBy === 'deadline') {
      const aD = a.dDay !== null && a.dDay >= 0 ? a.dDay : 9999;
      const bD = b.dDay !== null && b.dDay >= 0 ? b.dDay : 9999;
      return aD - bD;
    }

    if (criteria.sortBy === 'latest') {
      return (b.policy.applyStart || '').localeCompare(a.policy.applyStart || '');
    }

    if (criteria.sortBy === 'title') {
      return a.policy.title.localeCompare(b.policy.title, 'ko');
    }

    return 0;
  });

  const fullyEligibleCount = evaluations.filter(e => e.isFullyEligible).length;

  return (
    <section aria-label="맞춤 정책 판정 결과 목록" className="mt-8 space-y-5">
      {/* 화면 2: 헤더 & 필터 / 정렬 컨트롤 바 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        {/* 상단: 타이틀 & 매칭 요약 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                맞춤 정책 판정 결과
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              현재 조건(만 {criteria.age}세 · {criteria.region} · {criteria.employment} · {criteria.education})에 따른 실시간 분석
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              100% 완전 일치: {fullyEligibleCount}건
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              (총 {evaluations.length}건 검색됨)
            </span>
          </div>
        </div>

        {/* 카테고리 탭 & 정렬 셀렉터 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* 카테고리 탭 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map(cat => {
              const count =
                cat === '전체'
                  ? evaluations.length
                  : evaluations.filter(e => e.policy.category === cat).length;
              const isActive = criteria.category === cat;

              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                  <span className={`ml-1 text-[11px] ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 정렬 셀렉터 */}
          <div className="flex items-center gap-2 ml-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={criteria.sortBy}
              onChange={e => onSortChange(e.target.value as UserCriteria['sortBy'])}
              className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="recommend">적합도 높은 순 (추천)</option>
              <option value="deadline">마감 임박 순</option>
              <option value="latest">최신 등록 순</option>
              <option value="title">정책명 순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3대 상태 처리: 1) 로딩 상태 */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-20 bg-slate-200 rounded-sm"></div>
                <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded-sm"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded-sm"></div>
                <div className="h-4 w-5/6 bg-slate-100 rounded-sm"></div>
              </div>
              <div className="h-16 w-full bg-slate-50 rounded-xl"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-24 bg-slate-200 rounded-sm"></div>
                <div className="h-8 w-20 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3대 상태 처리: 2) 오류 상태 */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto my-10">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-red-900">
              정책 데이터를 불러오지 못했습니다
            </h3>
            <p className="text-xs sm:text-sm text-red-700 mt-1">
              {error}
            </p>
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            다시 시도하기
          </button>
        </div>
      )}

      {/* 3대 상태 처리: 3) 빈 결과 상태 */}
      {!isLoading && !error && sorted.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center space-y-4 max-w-lg mx-auto my-8 shadow-xs">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              선택하신 조건에 부합하는 정책이 없습니다
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {criteria.onlyEligible
                ? '현재 "100% 완전 일치만 보기"가 켜져 있습니다. 체크를 해제하거나 나이·학력 등의 조건을 완화해 보세요.'
                : '검색어나 카테고리 필터를 변경해 보세요.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={onResetCriteria}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              조건 초기화하기
            </button>
          </div>
        </div>
      )}

      {/* 카드 그리드: 모바일 1열(360px), 태블릿 2열, PC 3열(1440px) */}
      {!isLoading && !error && sorted.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map(evaluation => (
            <PolicyCard
              key={evaluation.policy.id}
              evaluation={evaluation}
              onSelect={() => onSelectPolicy(evaluation)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
