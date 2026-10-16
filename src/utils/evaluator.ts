import { Policy, UserCriteria, PolicyEvaluation } from '../types/policy.ts';

// 기준일 (현재 시스템 날짜 기준 계산)
function getCurrentDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * D-Day 계산 함수
 */
export function calculateDDay(applyEnd: string | null): { dDay: number | null; dDayLabel: string } {
  if (!applyEnd) {
    return { dDay: null, dDayLabel: '상시 접수' };
  }

  const today = getCurrentDate();
  const endDate = new Date(applyEnd);

  if (isNaN(endDate.getTime())) {
    return { dDay: null, dDayLabel: '상시 접수' };
  }

  const timeDiff = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (diffDays < 0) {
    return { dDay: diffDays, dDayLabel: '마감' };
  }
  if (diffDays === 0) {
    return { dDay: 0, dDayLabel: '오늘 마감' };
  }
  if (diffDays <= 7) {
    return { dDay: diffDays, dDayLabel: `D-${diffDays} 마감임박` };
  }
  return { dDay: diffDays, dDayLabel: `D-${diffDays}` };
}

/**
 * 나이 적합도 판정
 */
export function checkAgeEligibility(policy: Policy, userAge: number): {
  matched: boolean;
  requirement: string;
} {
  const { targetAge } = policy;
  if (!targetAge || (targetAge.min === null && targetAge.max === null)) {
    return { matched: true, requirement: '연령 제한 없음' };
  }

  const min = targetAge.min ?? 0;
  const max = targetAge.max ?? 120;
  const matched = userAge >= min && userAge <= max;

  return {
    matched,
    requirement: `만 ${min}세 ~ ${max}세`,
  };
}

/**
 * 거주지 적합도 판정
 */
export function checkRegionEligibility(policy: Policy, userRegion: string): {
  matched: boolean;
  requirement: string;
} {
  const polRegion = (policy.region || '').trim();
  const fullText = `${policy.title} ${policy.summary} ${policy.targetCondition} ${polRegion}`;

  // 전국 단위 정책인 경우 모두 적격
  if (polRegion.includes('전국') || fullText.includes('전국') || fullText.includes('중앙부처')) {
    return { matched: true, requirement: '전국 공통 (대구 거주자 신청 가능)' };
  }

  // 사용자가 대구 거주일 때
  if (userRegion.includes('대구')) {
    if (fullText.includes('대구')) {
      return { matched: true, requirement: '대구광역시 거주 청년 대상' };
    }
  }

  // 기타 지역 매칭
  if (userRegion && fullText.includes(userRegion.slice(0, 2))) {
    return { matched: true, requirement: `${userRegion} 거주 청년 대상` };
  }

  return {
    matched: false,
    requirement: polRegion || '특정 지자체 제한',
  };
}

/**
 * 취업상태 적합도 판정
 */
export function checkEmploymentEligibility(policy: Policy, userEmp: string): {
  matched: boolean;
  requirement: string;
} {
  const rawText = `${policy.targetCondition} ${policy.summary} ${policy.raw?.jobStateCn ?? ''} ${policy.raw?.empmSttsCn ?? ''} ${policy.title}`;

  if (
    rawText.includes('제한없음') ||
    rawText.includes('무관') ||
    rawText.includes('누구나') ||
    rawText.includes('모든 청년')
  ) {
    return { matched: true, requirement: '취업 상태 무관' };
  }

  if (userEmp === '취업준비생' || userEmp === '미취업자') {
    const isMatch =
      rawText.includes('취업준비') ||
      rawText.includes('구직') ||
      rawText.includes('미취업') ||
      rawText.includes('실업') ||
      rawText.includes('단기') ||
      rawText.includes('졸업예정');
    return {
      matched: isMatch,
      requirement: isMatch ? '구직자·미취업자·취준생 대상' : '재직자 또는 타 상태 전용',
    };
  }

  if (userEmp === '단기근로자') {
    const isMatch =
      rawText.includes('단기') ||
      rawText.includes('아르바이트') ||
      rawText.includes('구직') ||
      rawText.includes('미취업') ||
      rawText.includes('근로자');
    return {
      matched: isMatch,
      requirement: '단기근로 및 구직자 포함',
    };
  }

  if (userEmp === '재직자') {
    const isMatch =
      rawText.includes('재직') ||
      rawText.includes('근로자') ||
      rawText.includes('직장인') ||
      rawText.includes('고용보험') ||
      rawText.includes('중소기업');
    return {
      matched: isMatch,
      requirement: isMatch ? '재직자·근로 청년 대상' : '미취업자 전용 정책',
    };
  }

  if (userEmp === '창업가') {
    const isMatch =
      rawText.includes('창업') ||
      rawText.includes('스타트업') ||
      rawText.includes('예비창업') ||
      rawText.includes('사업자');
    return {
      matched: isMatch,
      requirement: '창업 희망 및 창업가 대상',
    };
  }

  if (userEmp === '대학생') {
    const isMatch =
      rawText.includes('대학생') ||
      rawText.includes('재학') ||
      rawText.includes('학생') ||
      rawText.includes('졸업예정');
    return {
      matched: isMatch,
      requirement: '대학생·재학생 대상',
    };
  }

  return { matched: true, requirement: '조건 확인 필요' };
}

/**
 * 학력 적합도 판정
 */
export function checkEducationEligibility(policy: Policy, userEdu: string): {
  matched: boolean;
  requirement: string;
} {
  const rawText = `${policy.targetCondition} ${policy.summary} ${policy.raw?.schoolStateCn ?? ''} ${policy.raw?.accrRqisCn ?? ''}`;

  if (
    rawText.includes('제한없음') ||
    rawText.includes('학력무관') ||
    rawText.includes('무관') ||
    !policy.raw?.schoolStateCn
  ) {
    return { matched: true, requirement: '학력 제한 없음' };
  }

  if (userEdu === '대졸 이상' || userEdu === '대학원 이상') {
    // 대졸 이상은 대부분 고졸 전용 특화가 아닌 이상 충족
    const onlyHighSchool = rawText.includes('고졸 이하') || rawText.includes('특성화고 전용');
    return {
      matched: !onlyHighSchool,
      requirement: onlyHighSchool ? '고졸 이하 전용 정책' : '대졸 이상 신청 가능',
    };
  }

  if (userEdu === '대학(교) 재학') {
    const isMatch = rawText.includes('재학') || rawText.includes('대학생') || rawText.includes('제한없음');
    return {
      matched: isMatch,
      requirement: isMatch ? '재학생 신청 가능' : '졸업자 전용 정책',
    };
  }

  if (userEdu === '고졸 이하') {
    const requiresDegree = rawText.includes('대졸') || rawText.includes('학사') || rawText.includes('전문대졸');
    return {
      matched: !requiresDegree,
      requirement: requiresDegree ? '대졸 이상 학력 요건' : '학력 제한 없음 (고졸 신청 가능)',
    };
  }

  return { matched: true, requirement: '학력 제한 없음' };
}

/**
 * 개별 정책에 대해 종합 자격 판정 수행
 */
export function evaluatePolicy(policy: Policy, criteria: UserCriteria): PolicyEvaluation {
  const ageResult = checkAgeEligibility(policy, criteria.age);
  const regionResult = checkRegionEligibility(policy, criteria.region);
  const employmentResult = checkEmploymentEligibility(policy, criteria.employment);
  const educationResult = checkEducationEligibility(policy, criteria.education);

  const matchedCount =
    (ageResult.matched ? 1 : 0) +
    (regionResult.matched ? 1 : 0) +
    (employmentResult.matched ? 1 : 0) +
    (educationResult.matched ? 1 : 0);

  const matchPercentage = Math.round((matchedCount / 4) * 100);
  const isFullyEligible = matchedCount === 4;

  const { dDay, dDayLabel } = calculateDDay(policy.applyEnd);

  const reasons: PolicyEvaluation['reasons'] = [
    {
      field: 'age',
      name: '연령 요건',
      matched: ageResult.matched,
      userValue: `만 ${criteria.age}세`,
      requirement: ageResult.requirement,
    },
    {
      field: 'region',
      name: '거주지 요건',
      matched: regionResult.matched,
      userValue: criteria.region,
      requirement: regionResult.requirement,
    },
    {
      field: 'employment',
      name: '취업상태 요건',
      matched: employmentResult.matched,
      userValue: criteria.employment,
      requirement: employmentResult.requirement,
    },
    {
      field: 'education',
      name: '학력 요건',
      matched: educationResult.matched,
      userValue: criteria.education,
      requirement: educationResult.requirement,
    },
  ];

  return {
    policy,
    isAgeMatch: ageResult.matched,
    isRegionMatch: regionResult.matched,
    isEmploymentMatch: employmentResult.matched,
    isEducationMatch: educationResult.matched,
    matchScore: matchedCount,
    matchPercentage,
    isFullyEligible,
    dDay,
    dDayLabel,
    reasons,
  };
}

/**
 * 캘린더(.ics) 파일 생성 및 브라우저 다운로드
 */
export function downloadPolicyIcs(policy: Policy) {
  const startDate = policy.applyStart ? policy.applyStart.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const endDate = policy.applyEnd ? policy.applyEnd.replace(/-/g, '') : startDate;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = `[온통청년] ${policy.title}`;
  const description = `${policy.summary || policy.title}\\n\\n신청 지원내용: ${policy.supportContent.slice(0, 150)}...\\n\\n신청링크: ${policy.applyUrl}`.replace(/\n/g, '\\n');
  const location = policy.region || '온라인 접수';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YouthPolicyFinder//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:policy-${policy.id}-${Date.now()}@youthpolicy.kr`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${policy.applyUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    'DESCRIPTION:청년정책 신청 마감 3일 전입니다.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${policy.title.slice(0, 25).replace(/[^\w\s가-힣]/g, '_')}_일정.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
