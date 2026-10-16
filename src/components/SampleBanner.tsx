import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

interface SampleBannerProps {
  isSample: boolean;
  source: string;
}

export const SampleBanner: React.FC<SampleBannerProps> = ({ isSample, source }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isSample) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs sm:text-sm text-emerald-800 flex items-center justify-between">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">온통청년 실시간 공공데이터 API 연동 중</span>
          <span className="text-emerald-600 hidden sm:inline">({source === 'api_spec_a' ? '신규 규격 A' : '구 규격 B'})</span>
        </div>
      </div>
    );
  }

  return (
    <aside aria-label="샘플 데이터 안내" className="bg-amber-50 border-b border-amber-200 text-amber-900 transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-900">
            <AlertCircle className="w-3.5 h-3.5" />
            샘플 데이터로 표시 중
          </span>
          <span className="text-amber-800">
            온통청년 API 키가 등록되지 않아 대구 청년 맞춤 정책 20건의 샘플 데이터를 표시하고 있습니다.
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-2 ml-auto"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>API 키 등록 방법</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="bg-amber-100/70 border-t border-amber-200 px-4 py-3 text-xs sm:text-sm text-amber-900 animate-fadeIn">
          <div className="max-w-7xl mx-auto space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5 text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              실시간 온통청년(youthcenter.go.kr) 오픈API로 전환하려면:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-amber-800 pl-1 leading-relaxed">
              <li>
                <strong>온통청년 포털</strong>(youthcenter.go.kr)에서 청년정책 오픈API 키를 발급받습니다.
              </li>
              <li>
                <strong>로컬 실행 시</strong>: 프로젝트 루트의 <code className="bg-amber-200 px-1 py-0.5 rounded font-mono">.env.local</code> 파일에 <code className="bg-amber-200 px-1 py-0.5 rounded font-mono">YOUTH_API_KEY=발급받은키</code> 를 입력하고 재시작합니다.
              </li>
              <li>
                <strong>Vercel 배포 시</strong>: Project Settings → Environment Variables에 Key: <code className="bg-amber-200 px-1 py-0.5 rounded font-mono">YOUTH_API_KEY</code>, Value: <code className="bg-amber-200 px-1 py-0.5 rounded font-mono">[키값]</code> 을 등록 후 Redeploy합니다.
              </li>
            </ol>
          </div>
        </div>
      )}
    </aside>
  );
};
