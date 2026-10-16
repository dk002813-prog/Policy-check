import { Policy } from '../types/policy.ts';
import { normalizePolicy } from '../utils/normalizePolicy.ts';
import samplePoliciesRaw from '../data/sample-policies.json';

export interface PolicyApiResponse {
  isSample: boolean;
  source: string;
  policies: Policy[];
  totalCount: number;
}

/**
 * 정책 데이터 불러오기:
 * 1. 우선 서버 함수 /api/policies 호출
 * 2. 서버 함수가 없거나(정적 미리보기), 404, 네트워크 실패, 또는 비정상 응답 시
 *    예외를 던지지 않고 sample-policies.json을 정규화하여 안전하게 반환
 */
export async function fetchPolicies(params?: {
  keyword?: string;
  category?: string;
  region?: string;
}): Promise<PolicyApiResponse> {
  const queryParams = new URLSearchParams();
  if (params?.keyword) queryParams.set('keyword', params.keyword);
  if (params?.category && params.category !== '전체') queryParams.set('category', params.category);
  if (params?.region && params.region !== '전체') queryParams.set('region', params.region);

  const endpoint = `/api/policies?${queryParams.toString()}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[policyService] /api/policies 응답 코드 ${response.status}. 샘플 데이터로 폴백합니다.`);
      return getLocalSampleFallback(params);
    }

    const data = await response.json();

    if (data && Array.isArray(data.policies)) {
      return {
        isSample: Boolean(data.isSample),
        source: data.source || 'api',
        policies: data.policies,
        totalCount: data.totalCount ?? data.policies.length,
      };
    }

    return getLocalSampleFallback(params);
  } catch (error) {
    console.warn('[policyService] /api/policies 호출 중 에러 발생. 로컬 샘플 데이터로 안전하게 전환합니다:', error);
    return getLocalSampleFallback(params);
  }
}

/**
 * 프론트엔드 자체 로컬 샘플 데이터 폴백 함수
 */
function getLocalSampleFallback(params?: {
  keyword?: string;
  category?: string;
  region?: string;
}): PolicyApiResponse {
  let list = (samplePoliciesRaw as Record<string, any>[]).map((item, idx) =>
    normalizePolicy(item, idx)
  );

  if (params?.keyword) {
    const k = params.keyword.toLowerCase().trim();
    list = list.filter(
      p =>
        p.title.toLowerCase().includes(k) ||
        p.summary.toLowerCase().includes(k) ||
        p.supportContent.toLowerCase().includes(k) ||
        p.targetCondition.toLowerCase().includes(k)
    );
  }

  if (params?.category && params.category !== '전체') {
    const targetCat = params.category;
    list = list.filter(p => p.category === targetCat || p.subCategory.includes(targetCat));
  }

  if (params?.region && params.region !== '전체') {
    const targetRegion = params.region;
    list = list.filter(p => p.region.includes(targetRegion) || p.region.includes('전국'));
  }

  return {
    isSample: true,
    source: 'local_sample_fallback',
    policies: list,
    totalCount: list.length,
  };
}
