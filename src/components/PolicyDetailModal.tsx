import React, { useState } from 'react';
import { PolicyEvaluation } from '../types/policy.ts';
import {
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  MapPin,
  Home,
  Info
} from 'lucide-react';
import { downloadPolicyIcs } from '../utils/evaluator.ts';

interface PolicyDetailModalProps {
  evaluation: PolicyEvaluation | null;
  onClose: () => void;
}

export const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({ evaluation, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!evaluation) return null;

  const { policy, matchScore, matchPercentage, isFullyEligible, dDay, dDayLabel, reasons } = evaluation;

  const isHousing = policy.category === '주거';

  // 지원 내용 텍스트 복사 기능
  const handleCopy = () => {
    const textToCopy = `[${policy.title}]\n- 분류: ${policy.category}\n- 지원내용: ${policy.supportContent}\n- 신청기한: ${policy.applyEnd || '상시접수'}\n- 신청링크: ${policy.applyUrl}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUrgent = dDay !== null && dDay >= 0 && dDay <= 7;

  // 온통청년 기본 링크 대체 검증
  const finalApplyUrl =
    policy.applyUrl && policy.applyUrl.startsWith('http')
      ? policy.applyUrl
      : 'https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch';

  // 외부 지도 검색 쿼리 링크
  const mapSearchUrl = `https://map.naver.com/p/search/${encodeURIComponent(policy.region + ' 청년센터')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {policy.category}
              </span>
              {policy.subCategory && (
                <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">
                  {policy.subCategory}
                </span>
              )}
              {isUrgent ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                  <Clock className="w-3 h-3" />
                  {dDayLabel}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {dDayLabel}
                </span>
              )}
            </div>

            <h2 id="policy-detail-title" className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {policy.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 스크롤 본문 */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* 자격 판정 결과 종합 카드 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border ${
              isFullyEligible
                ? 'bg-emerald-50/80 border-emerald-200'
                : 'bg-blue-50/70 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  나의 조건 vs 정책 자격 대조 결과
                </h3>
              </div>
              <span
                className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full ${
                  isFullyEligible
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {isFullyEligible ? '100% 완전 일치 (신청 적격)' : `${matchPercentage}% 적합 (${matchScore}/4)`}
              </span>
            </div>

            {/* 자격 판정 비교 테이블 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 sm:px-4">구분</th>
                    <th className="py-2.5 px-3 sm:px-4">나의 조건</th>
                    <th className="py-2.5 px-3 sm:px-4">정책 요건</th>
                    <th className="py-2.5 px-3 sm:px-4 text-center">판정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reasons.map(r => (
                    <tr key={r.field} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 sm:px-4 font-semibold text-slate-700">
                        {r.name}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-slate-800 font-medium">
                        {r.userValue}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-slate-600">
                        {r.requirement}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-center">
                        {r.matched ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            일치
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            확인
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 정책 개요 & 상세 정보 */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                정책 요약
              </h4>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {policy.summary || policy.title}
              </p>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                지원 내용
              </h4>
              <div className="text-sm sm:text-base text-slate-800 leading-relaxed bg-blue-50/40 p-4 rounded-xl border border-blue-100 font-medium">
                {policy.supportContent}
              </div>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                신청 자격 및 대상 세부 조건
              </h4>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <p>{policy.targetCondition}</p>
                {policy.raw?.schoolStateCn && (
                  <p className="text-slate-500">• 학력 요건: {policy.raw.schoolStateCn}</p>
                )}
                {policy.raw?.jobStateCn && (
                  <p className="text-slate-500">• 취업 요건: {policy.raw.jobStateCn}</p>
                )}
              </div>
            </div>

            {/* 일정 및 기관 정보 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  신청 기간
                </span>
                <p className="font-semibold text-slate-900">
                  {policy.applyStart || policy.applyEnd
                    ? `${policy.applyStart || '시작일 미정'} ~ ${policy.applyEnd || '마감일 미정'}`
                    : '상시 접수 (예산 소진 시 조기 마감)'}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  주관 기관 / 지역
                </span>
                <p className="font-semibold text-slate-900">
                  {policy.raw?.cnsgNmorOrgNm || policy.region}
                </p>
              </div>
            </div>

            {/* 외부 연동 축소 규칙에 따른 보조 리소스 링크 */}
            <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-500" />
                관련 외부 공공 서비스 바로가기
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={mapSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  대구 청년센터 지도 위치 검색
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {isHousing && (
                  <a
                    href="https://www.myhome.go.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-purple-600 transition-colors"
                  >
                    <Home className="w-3.5 h-3.5 text-purple-600" />
                    마이홈 청년주거 포털 검색
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 모달 하단 액션 버튼 바 */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* 지원 내용 복사 */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사됨!' : '내용 복사'}</span>
            </button>

            {/* 캘린더(.ics) 다운로드 (외부 연동 축소 규칙) */}
            <button
              onClick={() => downloadPolicyIcs(policy)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="구글·애플·아웃룩 캘린더 등록용 파일 다운로드"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>캘린더(.ics) 등록</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              닫기
            </button>

            {/* 신청 링크 (핵심 필수 요구사항) */}
            <a
              href={finalApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>신청 사이트 바로가기</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
