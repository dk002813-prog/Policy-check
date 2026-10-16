/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserCriteria, Policy, PolicyEvaluation } from './types/policy.ts';
import { fetchPolicies } from './services/policyService.ts';
import { evaluatePolicy } from './utils/evaluator.ts';
import { Header } from './components/Header.tsx';
import { SampleBanner } from './components/SampleBanner.tsx';
import { ConditionForm } from './components/ConditionForm.tsx';
import { PolicyList } from './components/PolicyList.tsx';
import { PolicyDetailModal } from './components/PolicyDetailModal.tsx';
import { Sparkles, Compass, ShieldCheck, Heart } from 'lucide-react';

const STORAGE_KEY = 'youth_policy_finder_criteria';

// [서비스 정의] 대상 사용자: [ 대구에 사는 30대 취업준비생 ] 기본 프리셋
const DEFAULT_CRITERIA: UserCriteria = {
  age: 32,
  region: '대구광역시',
  subRegion: '대구 전체',
  employment: '취업준비생',
  education: '대졸 이상',
  category: '전체',
  keyword: '',
  onlyEligible: false,
  sortBy: 'recommend',
};

export default function App() {
  // 1. 사용자 조건 상태 (localStorage 동기화, try/catch 처리)
  const [criteria, setCriteria] = useState<UserCriteria>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CRITERIA, ...parsed };
      }
    } catch (e) {
      console.warn('localStorage 불러오기 실패:', e);
    }
    return DEFAULT_CRITERIA;
  });

  // 2. 정책 데이터 및 API 상태
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isSample, setIsSample] = useState(true);
  const [source, setSource] = useState('sample_fallback');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. 상세 모달 상태
  const [selectedEvaluation, setSelectedEvaluation] = useState<PolicyEvaluation | null>(null);

  // 조건 변경 시 localStorage 저장 (try/catch)
  const handleCriteriaChange = useCallback((updated: Partial<UserCriteria>) => {
    setCriteria(prev => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('localStorage 저장 실패:', e);
      }
      return next;
    });
  }, []);

  // '대구 30대 취준생' 추천 프리셋 적용
  const handleApplyPreset = useCallback(() => {
    handleCriteriaChange({
      age: 32,
      region: '대구광역시',
      subRegion: '대구 전체',
      employment: '취업준비생',
      education: '대졸 이상',
      keyword: '',
      category: '전체',
      onlyEligible: false,
    });
  }, [handleCriteriaChange]);

  // 조건 초기화
  const handleResetCriteria = useCallback(() => {
    handleCriteriaChange(DEFAULT_CRITERIA);
  }, [handleCriteriaChange]);

  // 정책 데이터 호출 (화면 → /api/policies → 온통청년 API → 폴백 sample-policies.json)
  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPolicies({
        keyword: criteria.keyword,
        category: criteria.category,
        region: criteria.region,
      });
      setPolicies(result.policies);
      setIsSample(result.isSample);
      setSource(result.source);
    } catch (err: any) {
      console.error('정책 데이터 로드 실패:', err);
      setError(err?.message || '정책 정보를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [criteria.keyword, criteria.category, criteria.region]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  // 실시간 자격 판정 결과 계산
  const evaluations = useMemo(() => {
    return policies.map(policy => evaluatePolicy(policy, criteria));
  }, [policies, criteria]);

  const eligibleCount = useMemo(() => {
    return evaluations.filter(e => e.isFullyEligible).length;
  }, [evaluations]);

  // 현재 열려있는 모달이 있을 경우 업데이트된 criteria 반영
  useEffect(() => {
    if (selectedEvaluation) {
      const current = evaluations.find(e => e.policy.id === selectedEvaluation.policy.id);
      if (current) {
        setSelectedEvaluation(current);
      }
    }
  }, [evaluations, selectedEvaluation]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased text-base">
      {/* 온통청년 API 상태 안내 배너 (샘플 배너) */}
      <SampleBanner isSample={isSample} source={source} />

      {/* 헤더 */}
      <Header
        onResetPreset={handleApplyPreset}
        onRefresh={loadPolicies}
        isLoading={isLoading}
        eligibleCount={eligibleCount}
        totalCount={policies.length}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* 서비스 소개 히어로 영역 */}
        <section aria-label="서비스 소개" className="bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>대구에 사는 30대 취업준비생을 위한 맞춤 판정기</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              나이·거주지·취업상태·학력으로 <br className="hidden sm:inline" />
              나에게 맞는 청년정책만 쏙 골라보세요.
            </h2>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl">
              온통청년(youthcenter.go.kr) 오픈API 공공데이터와 내 조건을 실시간 대조하여 
              신청 가능한 지원금, 월세지원, 직업훈련, 희망적금 자격을 즉시 판정해 드립니다.
            </p>
          </div>
        </section>

        {/* 1단계: 조건 입력 폼 */}
        <ConditionForm
          criteria={criteria}
          onChange={handleCriteriaChange}
          onReset={handleResetCriteria}
          onApplyPreset={handleApplyPreset}
        />

        {/* 2단계: 조건에 맞는 정책 카드 목록 */}
        <PolicyList
          evaluations={evaluations}
          criteria={criteria}
          isLoading={isLoading}
          error={error}
          onSelectPolicy={setSelectedEvaluation}
          onCategoryChange={cat => handleCriteriaChange({ category: cat })}
          onSortChange={sort => handleCriteriaChange({ sortBy: sort })}
          onResetCriteria={handleResetCriteria}
          onRetry={loadPolicies}
        />
      </main>

      {/* 3단계: 정책 상세 모달 + 신청 링크 */}
      <PolicyDetailModal
        evaluation={selectedEvaluation}
        onClose={() => setSelectedEvaluation(null)}
      />

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-slate-500 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-700 font-bold">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>정책 탐색기</span>
            </div>
            <p className="text-slate-400 text-xs">
              공공데이터 제공: 대한민국 정부 온통청년(youthcenter.go.kr) 오픈API & 대구광역시 청년정책
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a
              href="https://www.youthcenter.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 underline underline-offset-4"
            >
              온통청년 바로가기
            </a>
            <a
              href="https://anys.daegu.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 underline underline-offset-4"
            >
              대구청년커뮤니티포털(젊프)
            </a>
            <a
              href="https://www.daeguyouth.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 underline underline-offset-4"
            >
              대구청년센터
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
