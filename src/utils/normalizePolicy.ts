import { Policy, TargetAge } from '../types/policy.ts';

const DEFAULT_APPLY_URL = 'https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch';

/**
 * 나이 텍스트(예: "만 19세 ~ 39세", "18~34세", "만 19세 이상")에서 최소·최대 연령 추출
 */
export function parseAgeRange(ageText: string | undefined | null): TargetAge | null {
  if (!ageText || typeof ageText !== 'string') return null;
  const cleaned = ageText.trim();
  if (!cleaned || cleaned.includes('제한없음') || cleaned.includes('무관') || cleaned.includes('해당없음')) {
    return null;
  }

  // 패턴 1: 숫자 ~ 숫자 (예: "만 19세 ~ 39세", "18세 이상 ~ 34세 이하", "19~39")
  const rangeMatch = cleaned.match(/(\d{1,2})\s*세?\s*(?:이상)?\s*[~-]\s*(\d{1,2})\s*세?(?:\s*이하)?/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }

  // 패턴 2: ~ N세 이하
  const maxMatch = cleaned.match(/(\d{1,2})\s*세\s*(?:이하|미만)/);
  if (maxMatch) {
    const max = parseInt(maxMatch[1], 10);
    return { min: 18, max };
  }

  // 패턴 3: N세 이상
  const minMatch = cleaned.match(/(\d{1,2})\s*세\s*(?:이상|초과)/);
  if (minMatch) {
    const min = parseInt(minMatch[1], 10);
    return { min, max: 39 };
  }

  return null;
}

/**
 * 신청기간 텍스트에서 시작일과 종료일(YYYY-MM-DD) 추출
 */
export function parseDates(dateStr: string | undefined | null, explicitEnd?: string | null): {
  applyStart: string | null;
  applyEnd: string | null;
} {
  let applyEnd: string | null = null;
  let applyStart: string | null = null;

  if (explicitEnd && typeof explicitEnd === 'string') {
    const cleanExplicit = explicitEnd.trim().replace(/[^0-9-]/g, '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanExplicit)) {
      applyEnd = cleanExplicit;
    }
  }

  if (!dateStr || typeof dateStr !== 'string') {
    return { applyStart, applyEnd };
  }

  if (dateStr.includes('상시') || dateStr.includes('연중') || dateStr.includes('수시')) {
    return { applyStart: null, applyEnd: null };
  }

  // YYYY-MM-DD 또는 YYYY.MM.DD 검색
  const dateMatches = dateStr.match(/\d{4}[-.]\d{1,2}[-.]\d{1,2}/g);
  if (dateMatches && dateMatches.length > 0) {
    const formatted = dateMatches.map(d => {
      const parts = d.split(/[-.]/).map(p => p.padStart(2, '0'));
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    });

    if (formatted.length >= 2) {
      applyStart = formatted[0];
      if (!applyEnd) applyEnd = formatted[1];
    } else if (formatted.length === 1 && !applyEnd) {
      applyEnd = formatted[0];
    }
  }

  return { applyStart, applyEnd };
}

/**
 * 대분류 정규화 (일자리, 주거, 교육, 복지문화, 참여권리)
 */
export function normalizeCategory(catRaw: string | undefined | null): string {
  if (!catRaw || typeof catRaw !== 'string') return '기타';
  const c = catRaw.trim();
  if (c.includes('일자리') || c.includes('취업') || c.includes('창업') || c === '023010') return '일자리';
  if (c.includes('주거') || c.includes('주택') || c === '023020') return '주거';
  if (c.includes('교육') || c.includes('역량') || c.includes('훈련') || c === '023030') return '교육';
  if (c.includes('복지') || c.includes('문화') || c.includes('생활') || c === '023040') return '복지문화';
  if (c.includes('참여') || c.includes('권리') || c.includes('거버넌스') || c === '023050') return '참여권리';
  return c || '일자리';
}

/**
 * 온통청년 API 응답 아이템 정규화 (규격 A, 규격 B 및 샘플 데이터 모두 지원)
 * 있을 법한 필드명 후보를 순서대로 찾아 첫 번째로 존재하는 값을 사용
 */
export function normalizePolicy(rawItem: Record<string, any>, index: number = 0): Policy {
  if (!rawItem || typeof rawItem !== 'object') {
    return {
      id: `fallback-${index}`,
      title: '정보 없음',
      category: '기타',
      subCategory: '',
      region: '전국',
      summary: '',
      supportContent: '',
      applyStart: null,
      applyEnd: null,
      targetAge: null,
      targetCondition: '',
      applyUrl: DEFAULT_APPLY_URL,
      raw: {},
    };
  }

  // 1. id 후보군
  const id = String(
    rawItem.plcyNo ??
    rawItem.bizId ??
    rawItem.polyBizSecd ??
    rawItem.id ??
    rawItem.polyBizId ??
    `policy-${index}`
  );

  // 2. 제목 후보군
  const title = String(
    rawItem.plcyNm ??
    rawItem.polyBizSjnm ??
    rawItem.title ??
    rawItem.polyBizNm ??
    rawItem.sjNm ??
    '청년 지원 정책'
  );

  // 3. 카테고리(대분류) 후보군
  const categoryRaw =
    rawItem.lclsfNm ??
    rawItem.polyBizTy ??
    rawItem.category ??
    rawItem.plcyTpNm ??
    rawItem.polyRlmCd ??
    '일자리';
  const category = normalizeCategory(categoryRaw);

  // 4. 중분류 후보군
  const subCategory = String(
    rawItem.mclsfNm ??
    rawItem.polyItcnCn ??
    rawItem.subCategory ??
    rawItem.plcyKywdNm ??
    ''
  );

  // 5. 지역 후보군
  const region = String(
    rawItem.zipCdNm ??
    rawItem.polyBizSecd ??
    rawItem.region ??
    rawItem.cnsgNmorOrgNm ??
    rawItem.polyBizSecdNm ??
    '대구광역시 / 전국'
  );

  // 6. 요약 후보군
  const summary = String(
    rawItem.plcyExplnCn ??
    rawItem.polyItcnCn ??
    rawItem.summary ??
    rawItem.plcyCn ??
    rawItem.polyBizSjnm ??
    ''
  );

  // 7. 지원 내용 후보군
  const supportContent = String(
    rawItem.plcySprtCn ??
    rawItem.sporCn ??
    rawItem.supportContent ??
    rawItem.sporScvl ??
    summary
  );

  // 8. 대상 연령 후보군
  const ageRaw =
    rawItem.sprtAgeLmtCn ??
    rawItem.ageInfo ??
    rawItem.targetAge ??
    rawItem.prpCn ??
    '';
  const targetAge = typeof rawItem.targetAge === 'object' && rawItem.targetAge !== null
    ? rawItem.targetAge
    : parseAgeRange(ageRaw);

  // 9. 신청 기간 및 날짜 추출
  const dateRaw =
    rawItem.aplyPrdCn ??
    rawItem.rqutPrdCn ??
    rawItem.aplyPrd ??
    '';
  const explicitEnd =
    rawItem.aplyPrdEndDt ??
    rawItem.rqutPrdEndDt ??
    null;
  const { applyStart, applyEnd } = parseDates(dateRaw, explicitEnd);

  // 10. 자격/대상 조건 후보군
  const targetCondition = String(
    rawItem.plcyTrgtDtlCn ??
    rawItem.targetCondition ??
    rawItem.empmSttsCn ??
    rawItem.accrRqisCn ??
    rawItem.prpCn ??
    '해당 정책의 세부 자격 요건을 확인하세요.'
  );

  // 11. 신청 링크 후보군
  let applyUrl = String(
    rawItem.aplyUrlAddr ??
    rawItem.rqutUrld ??
    rawItem.applyUrl ??
    rawItem.refUrlAddr1 ??
    DEFAULT_APPLY_URL
  ).trim();

  if (!applyUrl.startsWith('http://') && !applyUrl.startsWith('https://')) {
    applyUrl = DEFAULT_APPLY_URL;
  }

  return {
    id,
    title,
    category,
    subCategory,
    region,
    summary,
    supportContent,
    applyStart,
    applyEnd,
    targetAge,
    targetCondition,
    applyUrl,
    raw: rawItem,
  };
}
