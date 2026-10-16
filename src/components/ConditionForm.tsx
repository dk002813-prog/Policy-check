import React, { useState } from 'react';
import { UserCriteria, EmploymentStatus, EducationStatus } from '../types/policy.ts';
import {
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Search,
  CheckCircle2,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

interface ConditionFormProps {
  criteria: UserCriteria;
  onChange: (updated: Partial<UserCriteria>) => void;
  onReset: () => void;
  onApplyPreset: () => void;
}

const REGIONS = [
  '대구광역시',
  '서울특별시',
  '부산광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '경상북도',
  '경상남도',
  '전라북도',
  '전라남도',
  '충청북도',
  '충청남도',
  '강원특별자치도',
  '제주특별자치도',
];

const DAEGU_DISTRICTS = [
  '대구 전체',
  '중구',
  '동구',
  '서구',
  '남구',
  '북구',
  '수성구',
  '달서구',
  '달성군',
  '군위군',
];

const EMPLOYMENT_OPTIONS: { label: string; value: EmploymentStatus; desc: string }[] = [
  { label: '취업준비생', value: '취업준비생', desc: '취업 준비 중인 구직자' },
  { label: '미취업자', value: '미취업자', desc: '현재 실업 상태' },
  { label: '단기근로자', value: '단기근로자', desc: '알바·파트타임' },
  { label: '재직자', value: '재직자', desc: '중소기업·일반 재직' },
  { label: '창업가', value: '창업가', desc: '예비창업·초기사업자' },
  { label: '대학생', value: '대학생', desc: '대학(원) 재학생' },
];

const EDUCATION_OPTIONS: { label: string; value: EducationStatus }[] = [
  { label: '대졸 이상 (학사)', value: '대졸 이상' },
  { label: '대학(교) 재학', value: '대학(교) 재학' },
  { label: '고졸 이하', value: '고졸 이하' },
  { label: '대학원 이상', value: '대학원 이상' },
  { label: '제한없음 (무관)', value: '제한없음' },
];

export const ConditionForm: React.FC<ConditionFormProps> = ({
  criteria,
  onChange,
  onReset,
  onApplyPreset,
}) => {
  const [naturalText, setNaturalText] = useState('');
  const [naturalMessage, setNaturalMessage] = useState<string | null>(null);
  const [isNaturalOpen, setIsNaturalOpen] = useState(false);

  // 자연어 규칙 기반 파서 (외부 연동 축소 규칙: AI 챗봇 대체)
  const handleNaturalParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    const text = naturalText.trim();
    const updates: Partial<UserCriteria> = {};
    const parsedItems: string[] = [];

    // 1. 나이 감지 (예: 31살, 32세, 29, 만 30세)
    const ageMatch = text.match(/(?:만\s*)?(\d{2})\s*(?:살|세)/);
    if (ageMatch) {
      const parsedAge = parseInt(ageMatch[1], 10);
      if (parsedAge >= 15 && parsedAge <= 50) {
        updates.age = parsedAge;
        parsedItems.push(`나이: 만 ${parsedAge}세`);
      }
    }

    // 2. 지역 감지
    for (const r of REGIONS) {
      const shortName = r.slice(0, 2);
      if (text.includes(shortName)) {
        updates.region = r;
        parsedItems.push(`거주지: ${r}`);
        break;
      }
    }

    // 대구 세부 구/군 감지
    for (const d of DAEGU_DISTRICTS) {
      if (d !== '대구 전체' && text.includes(d)) {
        updates.subRegion = d;
        parsedItems.push(`구/군: ${d}`);
        break;
      }
    }

    // 3. 취업상태 감지
    if (text.includes('취준') || text.includes('구직') || text.includes('취업준비')) {
      updates.employment = '취업준비생';
      parsedItems.push('취업상태: 취업준비생');
    } else if (text.includes('미취업') || text.includes('백수') || text.includes('실업')) {
      updates.employment = '미취업자';
      parsedItems.push('취업상태: 미취업자');
    } else if (text.includes('알바') || text.includes('아르바이트') || text.includes('단기')) {
      updates.employment = '단기근로자';
      parsedItems.push('취업상태: 단기근로자');
    } else if (text.includes('직장') || text.includes('회사') || text.includes('재직') || text.includes('근로자')) {
      updates.employment = '재직자';
      parsedItems.push('취업상태: 재직자');
    } else if (text.includes('창업') || text.includes('스타트업') || text.includes('사업')) {
      updates.employment = '창업가';
      parsedItems.push('취업상태: 창업가');
    } else if (text.includes('대학생') || text.includes('재학')) {
      updates.employment = '대학생';
      parsedItems.push('취업상태: 대학생');
    }

    // 4. 학력 감지
    if (text.includes('대졸') || text.includes('대학교 졸업') || text.includes('학사')) {
      updates.education = '대졸 이상';
      parsedItems.push('학력: 대졸 이상');
    } else if (text.includes('고졸') || text.includes('고등학교')) {
      updates.education = '고졸 이하';
      parsedItems.push('학력: 고졸 이하');
    } else if (text.includes('대학원') || text.includes('석사') || text.includes('박사')) {
      updates.education = '대학원 이상';
      parsedItems.push('학력: 대학원 이상');
    } else if (text.includes('재학') || text.includes('휴학')) {
      updates.education = '대학(교) 재학';
      parsedItems.push('학력: 대학(교) 재학');
    }

    if (Object.keys(updates).length > 0) {
      onChange(updates);
      setNaturalMessage(`분석 완료: [${parsedItems.join(', ')}] 조건을 자동 적용했습니다.`);
    } else {
      setNaturalMessage('문장에서 나이, 지역, 취업상태, 학력 키워드를 찾지 못했습니다. 아래 폼에서 직접 선택해 주세요.');
    }
  };

  return (
    <section aria-label="나의 청년 자격 조건 입력" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 lg:p-7">
      {/* 타이틀 및 헤더 영역 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              나의 청년 조건 입력
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            입력하신 조건과 온통청년 정책의 지원 자격을 실시간으로 대조 판정합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApplyPreset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            대구 30대 취준생 추천 설정
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="조건 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            초기화
          </button>
        </div>
      </div>

      {/* 자연어 간편 입력 토글 (외부 연동 축소 규칙 구현) */}
      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsNaturalOpen(!isNaturalOpen)}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>문장으로 한 번에 조건 입력하기 (자연어 간편 파서)</span>
            <span className="text-xs font-normal text-slate-400">
              {isNaturalOpen ? '닫기 ▲' : '열기 ▼'}
            </span>
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            예: "대구 수성구 32살 대졸 취준생"
          </span>
        </div>

        {isNaturalOpen && (
          <form onSubmit={handleNaturalParse} className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={naturalText}
                onChange={e => setNaturalText(e.target.value)}
                placeholder="예: 대구 사는 31살인데 대학교 졸업하고 취업 준비 중이에요."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                조건 적용
              </button>
            </div>
            {naturalMessage && (
              <p className="text-xs font-medium text-blue-700 bg-blue-50/80 p-2 rounded-md">
                {naturalMessage}
              </p>
            )}
          </form>
        )}
      </div>

      {/* 4대 핵심 조건 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* ① 나이 입력 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
              <User className="w-4 h-4 text-blue-600" />
              <span>나이 (만 나이)</span>
            </label>
            <span className="text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              만 {criteria.age}세
              {criteria.age >= 30 && criteria.age <= 39 && (
                <span className="text-[11px] font-normal text-slate-500 ml-1">(30대)</span>
              )}
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="18"
              max="39"
              value={criteria.age}
              onChange={e => onChange({ age: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>만 18세</span>
              <span>25세</span>
              <span className="font-semibold text-blue-600">32세</span>
              <span>35세</span>
              <span>만 39세</span>
            </div>

            {/* 빠른 나이 선택 버튼 */}
            <div className="flex items-center gap-1 pt-1">
              {[24, 29, 32, 35, 39].map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onChange({ age: a })}
                  className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    criteria.age === a
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {a}세
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ② 거주지 입력 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>거주 지역</span>
            </label>
            <span className="text-xs font-semibold text-slate-500">
              {criteria.region.includes('대구') ? '대구 관내' : '타 시도'}
            </span>
          </div>

          <div className="space-y-1.5">
            <select
              value={criteria.region}
              onChange={e => onChange({ region: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            >
              {REGIONS.map(r => (
                <option key={r} value={r}>
                  {r} {r === '대구광역시' ? '★ (기본)' : ''}
                </option>
              ))}
            </select>

            {criteria.region === '대구광역시' && (
              <select
                value={criteria.subRegion || '대구 전체'}
                onChange={e => onChange({ subRegion: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                {DAEGU_DISTRICTS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ③ 취업상태 선택 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>취업 상태</span>
            </label>
            <span className="text-xs font-semibold text-blue-600">
              {criteria.employment}
            </span>
          </div>

          <select
            value={criteria.employment}
            onChange={e => onChange({ employment: e.target.value as EmploymentStatus })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
          >
            {EMPLOYMENT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.desc})
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-500 leading-tight">
            구직활동지원금·취업성공수당은 취업준비생/미취업자 요건이 적용됩니다.
          </p>
        </div>

        {/* ④ 최종학력 선택 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>최종 학력</span>
            </label>
            <span className="text-xs font-semibold text-slate-600">
              {criteria.education}
            </span>
          </div>

          <select
            value={criteria.education}
            onChange={e => onChange({ education: e.target.value as EducationStatus })}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
          >
            {EDUCATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-500 leading-tight">
            대부분의 청년 정책은 학력 제한이 없거나 대졸/졸업예정자 대상입니다.
          </p>
        </div>
      </div>

      {/* 검색어 & 필터 바 */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={criteria.keyword}
            onChange={e => onChange({ keyword: e.target.value })}
            placeholder="정책명 또는 지원내용 검색 (예: 수당, 월세, 자격증, 적금)"
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={criteria.onlyEligible}
              onChange={e => onChange({ onlyEligible: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              내 조건에 100% 부합하는 정책만 보기
            </span>
          </label>
        </div>
      </div>
    </section>
  );
};
