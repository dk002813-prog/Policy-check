import React from 'react';
import { PolicyEvaluation } from '../types/policy.ts';
import {
  Calendar,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Download,
  Building2,
  Clock,
  Sparkles
} from 'lucide-react';
import { downloadPolicyIcs } from '../utils/evaluator.ts';

interface PolicyCardProps {
  evaluation: PolicyEvaluation;
  onSelect: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  일자리: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  주거: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  교육: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  복지문화: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  참여권리: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  기타: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export const PolicyCard: React.FC<PolicyCardProps> = ({ evaluation, onSelect }) => {
  const { policy, matchScore, matchPercentage, isFullyEligible, dDay, dDayLabel, reasons } = evaluation;

  const catStyle = CATEGORY_COLORS[policy.category] || CATEGORY_COLORS.기타;

  // D-Day 강조 로직 (D-7 이내는 강조)
  const isUrgent = dDay !== null && dDay >= 0 && dDay <= 7;
  const isClosed = dDay !== null && dDay < 0;

  return (
    <article className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* 카드 상단 배지 바 */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
            >
              {policy.category}
            </span>
            {policy.subCategory && (
              <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">
                {policy.subCategory}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">
              {policy.region.includes('대구') ? '대구 관내' : '전국'}
            </span>
          </div>

          {/* D-Day 배지 */}
          <div>
            {isUrgent ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-xs animate-pulse">
                <Clock className="w-3 h-3" />
                {dDayLabel}
              </span>
            ) : isClosed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
                마감됨
              </span>
            ) : dDay === null ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                상시 접수
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {dDayLabel}
              </span>
            )}
          </div>
        </div>

        {/* 정책 제목 */}
        <h3
          onClick={onSelect}
          className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer leading-snug"
        >
          {policy.title}
        </h3>

        {/* 정책 요약 및 지원내용 */}
        <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {policy.summary || policy.supportContent}
        </p>
      </div>

      {/* 조건 일치 항목 배지 영역 (핵심 요구사항) */}
      <div className="px-5 py-3 bg-slate-50/80 border-y border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            자격 적합도
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isFullyEligible
                ? 'bg-emerald-100 text-emerald-800'
                : matchScore >= 3
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isFullyEligible ? '100% 완전 일치' : `${matchPercentage}% 적합 (${matchScore}/4)`}
          </span>
        </div>

        {/* 4대 조건 일치 상세 뱃지 그리드 */}
        <div className="grid grid-cols-2 gap-1.5">
          {reasons.map(r => (
            <div
              key={r.field}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium ${
                r.matched
                  ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
              title={`${r.name}: ${r.requirement}`}
            >
              {r.matched ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="truncate">
                {r.name.replace(' 요건', '')}: {r.matched ? '일치' : '확인'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 카드 하단 액션 바 */}
      <div className="p-4 pt-3 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[140px]">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {policy.raw?.cnsgNmorOrgNm || policy.region || '온통청년'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              downloadPolicyIcs(policy);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="캘린더 일정(.ics) 저장"
          >
            <Download className="w-4 h-4" />
          </button>

          <a
            href={policy.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <span>신청</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            <span>상세보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
