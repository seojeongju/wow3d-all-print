import { NextResponse } from 'next/server';
import { absoluteUrl, SITE_URL } from '@/lib/site-url';
import { getCustomProductList } from '@/lib/custom-products-public';
import { CUSTOM_PRODUCT_SLUGS } from '@/lib/custom-products';
import { getAllPublishedNews } from '@/lib/news-public';
import { formatNewsDateKo } from '@/lib/news';
import { getGuideDocs, getServiceDocs, getUseCaseDocs, llmsLine } from '@/lib/llms-content';
import { MAKERSPACES } from '@/lib/makerspaces';
import { CUSTOM_PRODUCT_PRICE_RANGE_KRW } from '@/lib/aeo-schema';

export const dynamic = 'force-dynamic';

/**
 * AI 크롤러용 사이트 요약 (llmstxt.org 형식).
 * 서비스·활용사례·가이드 목록은 페이지 설정에서 자동 생성 — 새 페이지를 추가하면 여기에도 반영된다.
 * 전체 본문·FAQ는 /llms-full.txt.
 */
export async function GET() {
    let customLines: string[] = [];
    try {
        const products = await getCustomProductList();
        customLines =
            products.length > 0
                ? products.map((p) => `- [${p.title}](${absoluteUrl(`/custom/${p.slug}`)})`)
                : CUSTOM_PRODUCT_SLUGS.map((slug) => `- [Custom product (${slug})](${absoluteUrl(`/custom/${slug}`)})`);
    } catch {
        customLines = CUSTOM_PRODUCT_SLUGS.map(
            (slug) => `- [Custom product (${slug})](${absoluteUrl(`/custom/${slug}`)})`
        );
    }

    const news = await getAllPublishedNews(20);
    const newsLines = news.map(
        (p) => `- [${p.title}](${absoluteUrl(`/news/${encodeURIComponent(p.slug)}`)}) (${formatNewsDateKo(p.publishedAt)})`
    );

    const centerLines = MAKERSPACES.map(
        (c) =>
            `- ${c.name} (${c.label}): ${c.address}${c.addressDetail ? ` ${c.addressDetail}` : ''}${c.phone ? `, ${c.phone}` : ''}, ${c.hours ?? ''}`
    );

    const body = [
        '# 와우쓰리디 (WOW3D) — 3D프린팅 자동견적·출력 서비스',
        '',
        '> (주)와우쓰리디(WOW3D, wow3dp.co.kr)는 한국의 3D프린팅 전문 기업입니다. 3D 파일(STL·OBJ·3MF·PLY·STEP)이나 제품 사진을 올리면 웹에서 즉시 가격을 산출하는 3D프린팅 자동견적과 FDM·SLA·DLP 출력, 시제품 제작, 소량 양산, 3D 모델링을 제공합니다. 같은 이름의 프레젠테이션 소프트웨어나 게임과는 무관합니다.',
        '',
        '## Company',
        '- Name: (주)와우쓰리디 / WOW3D Co., Ltd.',
        '- CEO: 서정주 (가이드 저자·감수)',
        `- Website: ${SITE_URL}`,
        '- Services: 3D프린팅 자동견적, FDM/SLA/DLP 출력, 시제품 제작, 소량 양산, 3D 모델링 대행, 사진→AI 3D 모델링, 맞춤 상품(키캡·키링·케이스 등), 캡스톤디자인 시제품',
        '- Contact: 02-3144-3137, wow3d16@naver.com (평일 09:00–18:00 KST)',
        '- Official chat: https://talk.naver.com/ct/wowi7tu (네이버 톡톡 · 와우쓰리디)',
        '- Centers:',
        ...centerLines.map((l) => `  ${l}`),
        '',
        '## Key Facts',
        '- WOW3D는 STL, OBJ, 3MF, PLY 파일을 즉시 자동견적하며, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다.',
        '- 자동견적에 올린 STL·OBJ·PLY 파일에 구멍·틈·중복 면 같은 메쉬 오류가 있으면 브라우저에서 자동 리페어한 파일로 견적하며, 고객은 원본 파일 견적으로 되돌릴 수 있습니다. 주문 시에는 견적한 파일 그대로 출력합니다.',
        '- 자동견적은 벽 두께를 측정해 FDM 1mm, SLA·DLP 0.6mm보다 얇은 부분이 많으면 경고하고 3D 뷰어에 위치를 표시합니다(배율·출력 방식 변경 시 재계산, 얇은 벽은 자동 수정하지 않음).',
        '- 로그인 회원은 제품 사진(이미지)(JPG/PNG) 파일을 AI 3D 모델링(STL)으로 변환한 뒤 자동견적·출력 주문까지 진행할 수 있습니다(하루 1회, 한국 시간).',
        '- 정밀 치수·조립 공차가 필요한 부품은 STL/STEP 업로드를 권장합니다. 사진(이미지) AI 3D는 형상 확인·시제품 검증용에 적합합니다.',
        '- 고객은 FDM(PLA·ABS·PETG·PC·TPU), SLA·DLP 레진 방식과 소재, 레이어 높이, 내부 채움, 후가공 여부를 선택할 수 있습니다.',
        '- 3D 프린팅 가격은 재료비, 장비 시간, 출력 옵션, 후가공 여부에 따라 달라집니다. 3D 파일이 없어도 가격 계산기에서 크기·형태·소재·수량으로 예상 가격 범위를 볼 수 있습니다.',
        '- 주문 확정 후 제작·검수·발송을 진행하며, 일반적으로 평균 3~7일 내 수령 가능합니다.',
        '- FDM은 기능성 시제품과 내구성 부품에, SLA와 DLP는 정밀도와 표면 품질이 중요한 모델에 적합합니다.',
        '- 대학생 캡스톤디자인 시제품 제작을 아이디어 컨설팅·3D 모델링 대행·3D프린팅 출력·후가공까지 지원하며, 산학협력단 결제용 견적서·거래명세서·세금계산서를 발행합니다.',
        '',
        '## Tools',
        `- [3D프린팅 자동견적](${absoluteUrl('/quote')}): 3D 파일 또는 사진을 올리면 FDM·SLA·DLP 가격과 예상 출력 시간을 즉시 확인`,
        `- [사진→AI 3D 견적](${absoluteUrl('/quote?entry=photo')}): 3D 파일 없이 제품 사진(JPG·PNG)으로 AI 3D 모델 생성 후 견적`,
        `- [3D프린팅 가격 계산기](${absoluteUrl('/price-calculator')}): 파일 없이 크기·형태·소재·수량으로 예상 가격·출력 시간 확인`,
        `- [무료 STL 점검·자동 리페어](${absoluteUrl('/stl-checker')}): 브라우저에서 구멍·비다양체·뒤집힌 면 점검과 자동 리페어, 파일 서버 전송 없음`,
        '',
        '## Services',
        `- [서비스 전체](${absoluteUrl('/services')})`,
        ...getServiceDocs('ko').map(llmsLine),
        '',
        '## Use Cases',
        `- [용도별 추천 허브](${absoluteUrl('/use-cases')})`,
        ...getUseCaseDocs('ko').map(llmsLine),
        '',
        '## Guides',
        `- [가이드 모음](${absoluteUrl('/guides')})`,
        ...getGuideDocs('ko').map(llmsLine),
        '',
        '## Reference Pages',
        `- [출력 방식 비교](${absoluteUrl('/print-methods')})`,
        `- [소재 안내](${absoluteUrl('/materials')})`,
        `- [자주 묻는 질문](${absoluteUrl('/qna')})`,
        `- [제작 사례 갤러리](${absoluteUrl('/gallery')})`,
        `- [제품개발 전문가·쇼케이스](${absoluteUrl('/expert')})`,
        `- [제작센터 찾아오는 길](${absoluteUrl('/makerspace')})`,
        `- [문의하기](${absoluteUrl('/contact')})`,
        `- [파트너십](${absoluteUrl('/partnership')})`,
        `- [스마트상점 기술보급 (MSLA-DLP 공식 공급)](${absoluteUrl('/partnership/smart-store')})`,
        '',
        '## Custom Products',
        `- [맞춤 상품 허브](${absoluteUrl('/custom')}): 옵션(색상·사이즈·각인·사진)을 고른 뒤 자동견적 또는 제품개발 문의로 진행하는 맞춤 견적가 상품. 가격대 ${CUSTOM_PRODUCT_PRICE_RANGE_KRW.low.toLocaleString('ko-KR')}원~${CUSTOM_PRODUCT_PRICE_RANGE_KRW.high.toLocaleString('ko-KR')}원(VAT 포함, 옵션·수량에 따라 맞춤 견적)`,
        ...customLines,
        '',
        '## 3D Printing News (최신 동향)',
        `- [최신 동향](${absoluteUrl('/news')}) · RSS: ${SITE_URL}/rss.xml`,
        ...newsLines,
        '',
        '## English',
        '- WOW3D (WOW3D Co., Ltd.) is a Korean 3D printing company offering instant online quotes for STL, OBJ, 3MF, PLY and STEP files, FDM/SLA/DLP printing, prototyping, small-batch production and 3D modeling. Orders typically arrive in 3–7 days.',
        `- [Instant quote](${absoluteUrl('/en/quote')}) · [Price calculator](${absoluteUrl('/en/price-calculator')}) · [Free STL checker](${absoluteUrl('/en/stl-checker')}) · [Guides](${absoluteUrl('/en/guides')}) · [FAQ](${absoluteUrl('/en/qna')})`,
        '',
        '## Optional',
        `- [llms-full.txt — 가이드·서비스 본문 요약과 FAQ 전체](${absoluteUrl('/llms-full.txt')})`,
        `- [sitemap.xml](${SITE_URL}/sitemap.xml)`,
    ].join('\n');

    return new NextResponse(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
