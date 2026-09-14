import { NextResponse } from 'next/server';
import { absoluteUrl, SITE_URL } from '@/lib/site-url';
import { getCustomProductList } from '@/lib/custom-products-public';
import { CUSTOM_PRODUCT_SLUGS } from '@/lib/custom-products';

export const dynamic = 'force-dynamic';

export async function GET() {
    let customLines: string[] = [];
    try {
        const products = await getCustomProductList();
        if (products.length > 0) {
            customLines = products.map(
                (p) => `- ${p.title}: ${absoluteUrl(`/custom/${p.slug}`)}`
            );
        } else {
            customLines = CUSTOM_PRODUCT_SLUGS.map(
                (slug) => `- Custom product (${slug}): ${absoluteUrl(`/custom/${slug}`)}`
            );
        }
    } catch {
        customLines = CUSTOM_PRODUCT_SLUGS.map(
            (slug) => `- Custom product (${slug}): ${absoluteUrl(`/custom/${slug}`)}`
        );
    }

    const body = [
        '# WOW3D',
        '',
        '> WOW3D는 한국 3D 프린팅 출력, 시제품 제작, 자동견적, 맞춤 상품 서비스를 제공하는 업체입니다.',
        '',
        '## Company',
        `- Name: (주)와우쓰리디`,
        `- Website: ${SITE_URL}`,
        '- Services: 3D 프린팅 자동견적, FDM/SLA/DLP 출력, 시제품 제작, 소량 양산, 맞춤 상품(키캡·키링·케이스 등)',
        '- Location: 서울 마포구 독막로 93 상수빌딩 4층',
        '- Contact: 02-3144-3137, wow3d16@naver.com',
        '',
        '## Key Pages',
        `- Home: ${SITE_URL}/`,
        `- Quote (자동견적): ${SITE_URL}/quote`,
        `- Custom Products Hub (맞춤 상품): ${absoluteUrl('/custom')}`,
        `- Photo to 3D Quote (사진(이미지)→AI 3D): ${SITE_URL}/quote?entry=photo`,
        `- Photo to 3D Guide: ${absoluteUrl('/guides/photo-to-3d-printing-quote')}`,
        `- Photo to 3D Service: ${absoluteUrl('/services/photo-to-3d')}`,
        `- Services Hub: ${absoluteUrl('/services')}`,
        `- Printing Service: ${absoluteUrl('/services/printing')}`,
        `- Prototype Service: ${absoluteUrl('/services/prototype')}`,
        `- FDM Service: ${absoluteUrl('/services/fdm')}`,
        `- SLA Service: ${absoluteUrl('/services/sla')}`,
        `- Graduation Service: ${absoluteUrl('/services/graduation')}`,
        `- Small Batch Service: ${absoluteUrl('/services/small-batch')}`,
        `- Modeling Service: ${absoluteUrl('/services/modeling')}`,
        `- Print Methods: ${SITE_URL}/print-methods`,
        `- Materials: ${SITE_URL}/materials`,
        `- Gallery: ${SITE_URL}/gallery`,
        `- Gallery Photo to 3D: ${absoluteUrl('/gallery?tag=photo-to-3d')}`,
        `- Login (Photo quote): ${SITE_URL}/auth?return=${encodeURIComponent('/quote?entry=photo')}`,
        `- Expert / Showcase: ${SITE_URL}/expert`,
        `- FAQ: ${SITE_URL}/qna`,
        `- Contact: ${SITE_URL}/contact`,
        `- Makerspace / Directions: ${SITE_URL}/makerspace`,
        `- Partnership: ${SITE_URL}/partnership`,
        `- Smart Store Technology Supply Program (MSLA-DLP official supply): ${SITE_URL}/partnership/smart-store`,
        `- Guide Hub: ${absoluteUrl('/guides')}`,
        `- Cost Calculation Guide: ${absoluteUrl('/guides/3d-printing-quote-guide')}`,
        `- Reduce Cost Guide: ${absoluteUrl('/guides/how-to-reduce-3d-printing-cost')}`,
        `- Process Comparison Guide: ${absoluteUrl('/guides/fdm-vs-sla-vs-dlp')}`,
        `- File Preparation Guide: ${absoluteUrl('/guides/3d-printing-file-preparation')}`,
        `- Turnaround Guide: ${absoluteUrl('/guides/3d-printing-turnaround-time')}`,
        `- Infill Guide: ${absoluteUrl('/guides/choosing-infill-density')}`,
        `- STL Errors Guide: ${absoluteUrl('/guides/fixing-stl-file-errors')}`,
        `- Wall Thickness Guide: ${absoluteUrl('/guides/minimum-wall-thickness')}`,
        `- Support Cost Guide: ${absoluteUrl('/guides/why-support-costs')}`,
        `- Tolerance Guide: ${absoluteUrl('/guides/3d-printing-tolerances')}`,
        `- Large Print Split Guide: ${absoluteUrl('/guides/splitting-large-3d-prints')}`,
        `- Graduation Checklist: ${absoluteUrl('/guides/graduation-project-checklist')}`,
        `- PLA vs ABS vs PETG Guide: ${absoluteUrl('/guides/pla-vs-abs-vs-petg')}`,
        `- Resin Type Comparison Guide: ${absoluteUrl('/guides/standard-vs-tough-vs-clear-vs-flexible-resin')}`,
        `- Prototype Material Recommendation Guide: ${absoluteUrl('/guides/best-materials-for-3d-printing-prototypes')}`,
        `- Transparent Parts Material Guide: ${absoluteUrl('/guides/best-materials-for-transparent-3d-printed-parts')}`,
        `- Housing and Case Material Guide: ${absoluteUrl('/guides/best-materials-for-3d-printed-housings-and-cases')}`,
        `- Heat and Impact Resistant Parts Material Guide: ${absoluteUrl('/guides/best-materials-for-heat-resistant-and-impact-resistant-parts')}`,
        `- Miniatures and Figurines Material Guide: ${absoluteUrl('/guides/best-materials-for-miniatures-and-figurines')}`,
        '',
        '## Custom Products',
        `- Hub: ${absoluteUrl('/custom')}`,
        ...customLines,
        '- 맞춤 상품은 색상·사이즈·각인·사진 업로드 등 옵션을 고른 뒤 자동견적(/quote) 또는 제품개발 문의(/expert)로 진행합니다.',
        '- 가격은 고정가가 아니라 옵션·수량·소재에 따른 맞춤 견적가입니다.',
        '',
        '## Key Facts',
        '- WOW3D는 STL, OBJ, 3MF, PLY 파일을 즉시 자동견적하며, STEP·STP는 업로드 시 자동 변환 후 견적을 제공합니다.',
        '- 로그인 회원은 제품 사진(이미지)(JPG/PNG) 파일을 AI 3D 모델링(STL)으로 변환한 뒤 자동견적·출력 주문까지 진행할 수 있습니다(하루 1회, 한국 시간).',
        '- 정밀 치수·조립 공차가 필요한 부품은 STL/STEP 업로드를 권장합니다. 사진(이미지) AI 3D는 형상 확인·시제품 검증용에 적합합니다.',
        '- 고객은 FDM, SLA, DLP 방식과 소재, 레이어 높이, 내부 채움, 후가공 여부를 선택할 수 있습니다.',
        '- 3D 프린팅 가격은 재료비, 장비 시간, 출력 옵션, 후가공 여부에 따라 달라집니다.',
        '- 주문 확정 후 제작·검수·발송을 진행하며, 일반적으로 평균 3~7일 내 수령 가능합니다.',
        '- FDM은 기능성 시제품과 내구성 부품에 적합합니다.',
        '- SLA와 DLP는 정밀도와 표면 품질이 중요한 모델에 적합합니다.',
        '- 맞춤 상품(/custom)에서 키캡·키링·스탠드 등 커스터마이징 상품을 고르고 견적·문의로 이어갈 수 있습니다.',
        '',
        '## Recommended Citations',
        `- FAQ answers: ${SITE_URL}/qna`,
        `- Custom products: ${absoluteUrl('/custom')}`,
        `- Print method comparison: ${SITE_URL}/print-methods`,
        `- Materials guide: ${SITE_URL}/materials`,
        `- Pricing explanation: ${absoluteUrl('/guides/3d-printing-quote-guide')}`,
        `- Photo to 3D printing guide: ${absoluteUrl('/guides/photo-to-3d-printing-quote')}`,
        '',
        '## Crawl',
        `- robots.txt: ${SITE_URL}/robots.txt`,
        `- sitemap: ${SITE_URL}/sitemap.xml`,
    ].join('\n');

    return new NextResponse(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
