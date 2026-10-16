import type { IncomingMessage, ServerResponse } from 'http';
import samplePolicies from '../src/data/sample-policies.json';
import { normalizePolicy } from '../src/utils/normalizePolicy.ts';

// Vercel Serverless Function & Vite dev server handler
export default async function handler(req: any, res: any) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status ? res.status(200).end() : (res.statusCode = 200, res.end());
    return;
  }

  // 쿼리 파라미터 파싱
  const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const query = req.query || Object.fromEntries(urlObj.searchParams.entries());

  const page = parseInt(query.page || query.pageNum || query.pageIndex || '1', 10);
  const pageSize = parseInt(query.pageSize || query.display || '20', 10);
  const keyword = (query.keyword || query.query || query.plcyNm || '').trim();
  const category = (query.category || query.lclsfNm || query.bizTycdSel || '').trim();
  const region = (query.region || query.zipCd || query.srchPolyBizSecd || '').trim();

  // API 키: 서버 환경변수에서만 읽음 (절대 외부 유출 금지)
  const apiKey = (process.env.YOUTH_API_KEY || '').trim();

  // 키가 없거나 플레이스홀더인 경우 즉시 C. 샘플 데이터로 안전하게 폴백
  if (!apiKey || apiKey === '키값' || apiKey === 'MY_KEY' || apiKey.includes('여기에')) {
    console.log('[policies-api] 온통청년 API 키가 설정되지 않아 샘플 데이터를 제공합니다.');
    const sampleResult = getSampleResponse(page, pageSize, keyword, category, region);
    sendJson(res, 200, sampleResult);
    return;
  }

  // A. 신규 규격 시도
  try {
    const specAUrl = new URL('https://www.youthcenter.go.kr/go/ythip/getPlcy');
    specAUrl.searchParams.set('apiKeyNm', apiKey);
    specAUrl.searchParams.set('pageNum', String(page));
    specAUrl.searchParams.set('pageSize', String(pageSize));
    specAUrl.searchParams.set('rtnType', 'json');

    if (keyword) specAUrl.searchParams.set('plcyNm', keyword);
    if (category && category !== '전체') specAUrl.searchParams.set('lclsfNm', category);
    if (region && region !== '전체') specAUrl.searchParams.set('zipCd', region);

    const controllerA = new AbortController();
    const timeoutA = setTimeout(() => controllerA.abort(), 6000);

    const responseA = await fetch(specAUrl.toString(), {
      signal: controllerA.signal,
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    clearTimeout(timeoutA);

    if (responseA.ok) {
      const textA = await responseA.text();
      let jsonA: any = null;
      try {
        jsonA = JSON.parse(textA);
      } catch {
        jsonA = null;
      }

      if (jsonA && typeof jsonA === 'object') {
        const rawList =
          jsonA.result?.youthPolicyList ||
          jsonA.youthPolicyList ||
          jsonA.result?.list ||
          jsonA.youthPolicy ||
          jsonA.items ||
          [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          // 키를 제외한 응답 원본 1건 로그 기록
          logFirstItemSafe(rawList[0], 'Spec A');

          const normalizedList = rawList.map((item: any, idx: number) => normalizePolicy(item, idx));
          const totalCount =
            Number(jsonA.result?.pagging?.totCount ?? jsonA.totalCount ?? normalizedList.length);

          sendJson(res, 200, {
            isSample: false,
            source: 'api_spec_a',
            page,
            pageSize,
            totalCount,
            policies: normalizedList,
          });
          return;
        }
      }
    }
  } catch (err: any) {
    console.warn('[policies-api] 규격 A 호출 실패/타임아웃. 규격 B를 시도합니다.', err.message);
  }

  // B. 구 규격 시도
  try {
    const specBUrl = new URL('https://www.youthcenter.go.kr/opi/youthPlcyList.do');
    specBUrl.searchParams.set('openApiVlak', apiKey);
    specBUrl.searchParams.set('pageIndex', String(page));
    specBUrl.searchParams.set('display', String(pageSize));

    if (keyword) specBUrl.searchParams.set('query', keyword);
    if (category && category !== '전체') specBUrl.searchParams.set('bizTycdSel', category);
    if (region && region !== '전체') specBUrl.searchParams.set('srchPolyBizSecd', region);

    const controllerB = new AbortController();
    const timeoutB = setTimeout(() => controllerB.abort(), 6000);

    const responseB = await fetch(specBUrl.toString(), {
      signal: controllerB.signal,
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    clearTimeout(timeoutB);

    if (responseB.ok) {
      const textB = await responseB.text();
      let jsonB: any = null;
      try {
        jsonB = JSON.parse(textB);
      } catch {
        jsonB = null;
      }

      if (jsonB && typeof jsonB === 'object') {
        const rawList =
          jsonB.youthPolicyList ||
          jsonB.youthPolicy ||
          jsonB.result?.youthPolicyList ||
          jsonB.items ||
          [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          // 키를 제외한 응답 원본 1건 로그 기록
          logFirstItemSafe(rawList[0], 'Spec B');

          const normalizedList = rawList.map((item: any, idx: number) => normalizePolicy(item, idx));
          const totalCount =
            Number(jsonB.totalCnt ?? jsonB.pageIndex?.totalCnt ?? normalizedList.length);

          sendJson(res, 200, {
            isSample: false,
            source: 'api_spec_b',
            page,
            pageSize,
            totalCount,
            policies: normalizedList,
          });
          return;
        }
      }
    }
  } catch (err: any) {
    console.warn('[policies-api] 규격 B 호출 실패/타임아웃. C. 샘플 데이터로 폴백합니다.', err.message);
  }

  // C. 둘 다 실패하거나 유효 데이터가 없을 때 안전하게 샘플 데이터 제공
  console.log('[policies-api] 온통청년 API 호출 불가 또는 응답 부재로 샘플 데이터로 폴백합니다.');
  const sampleResult = getSampleResponse(page, pageSize, keyword, category, region);
  sendJson(res, 200, sampleResult);
}

/**
 * 응답 원본 1건을 로그로 남기되 API 키나 민감 정보는 절대 출력하지 않음
 */
function logFirstItemSafe(rawItem: any, specLabel: string) {
  try {
    const safeCopy = { ...rawItem };
    delete safeCopy.apiKeyNm;
    delete safeCopy.openApiVlak;
    delete safeCopy.apiKey;
    console.log(`[policies-api] [${specLabel}] 수신 원본 1건(필드 대조용):`, JSON.stringify(safeCopy, null, 2));
  } catch {
    // ignore
  }
}

/**
 * 샘플 데이터를 쿼리에 맞게 필터링하여 응답 생성
 */
function getSampleResponse(
  page: number,
  pageSize: number,
  keyword: string,
  category: string,
  region: string
) {
  let list = samplePolicies.map((item, idx) => normalizePolicy(item, idx));

  if (keyword) {
    const k = keyword.toLowerCase();
    list = list.filter(
      p =>
        p.title.toLowerCase().includes(k) ||
        p.summary.toLowerCase().includes(k) ||
        p.supportContent.toLowerCase().includes(k) ||
        p.targetCondition.toLowerCase().includes(k)
    );
  }

  if (category && category !== '전체') {
    list = list.filter(p => p.category === category || p.subCategory.includes(category));
  }

  if (region && region !== '전체') {
    list = list.filter(p => p.region.includes(region) || p.region.includes('전국'));
  }

  const totalCount = list.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = list.slice(startIndex, startIndex + pageSize);

  return {
    isSample: true,
    source: 'sample_fallback',
    page,
    pageSize,
    totalCount,
    policies: paginated,
  };
}

/**
 * Express 및 Vercel Serverless Function 모두와 호환되는 JSON 전송 헬퍼
 */
function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    res.status(statusCode).json(data);
  } else {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  }
}
