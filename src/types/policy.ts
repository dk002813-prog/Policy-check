/**
 * 정책 탐색기 공통 모델 및 타입 정의
 */

export interface TargetAge {
  min: number | null;
  max: number | null;
}

export interface Policy {
  id: string;
  title: string;
  category: string; // 대분류: 일자리, 주거, 교육, 복지문화, 참여권리
  subCategory: string; // 중분류
  region: string; // 지역 (예: 대구광역시, 전국 등)
  summary: string; // 정책 요약
  supportContent: string; // 지원 내용
  applyStart: string | null; // YYYY-MM-DD 또는 null
  applyEnd: string | null; // YYYY-MM-DD 또는 null
  targetAge: TargetAge | null; // 최소·최대 연령 또는 null
  targetCondition: string; // 신청 자격 / 대상 조건 문자열
  applyUrl: string; // 신청 링크 (없으면 온통청년 통합검색 기본 링크)
  raw: Record<string, any>; // 원본 데이터 보관
}

export type EmploymentStatus =
  | '취업준비생'
  | '미취업자'
  | '단기근로자'
  | '재직자'
  | '창업가'
  | '대학생';

export type EducationStatus =
  | '고졸 이하'
  | '대학(교) 재학'
  | '대졸 이상'
  | '대학원 이상'
  | '제한없음';

export interface UserCriteria {
  age: number;
  region: string;
  subRegion?: string;
  employment: EmploymentStatus;
  education: EducationStatus;
  category: string;
  keyword: string;
  onlyEligible: boolean;
  sortBy: 'recommend' | 'deadline' | 'latest' | 'title';
}

export interface PolicyEvaluation {
  policy: Policy;
  isAgeMatch: boolean;
  isRegionMatch: boolean;
  isEmploymentMatch: boolean;
  isEducationMatch: boolean;
  matchScore: number; // 0 ~ 4
  matchPercentage: number; // 0 ~ 100
  isFullyEligible: boolean;
  dDay: number | null; // null: 상시, 음수: 마감됨, 0: 오늘마감, 양수: D-N
  dDayLabel: string;
  reasons: {
    field: 'age' | 'region' | 'employment' | 'education';
    name: string;
    matched: boolean;
    userValue: string;
    requirement: string;
  }[];
}
