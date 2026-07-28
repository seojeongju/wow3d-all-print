import { NextResponse } from 'next/server';
import { absoluteUrl, SITE_URL } from '@/lib/site-url';

export function GET() {
    const body = [
        '# WOW3D',
        '',
        '> WOW3D는 한국 3D 프린팅 출력, 시제품 제작, 자동견적 서비스를 제공하는 업체입니다.',
        '',
        '## Company',
        `- Name: (주)와우쓰리디`,
        `- Website: ${SITE_URL}`,
        '- Services: 3D 프린팅 자동견적, FDM/SLA/DLP 출력, 시제품 제작, 소량 양산',
        '- Location: 서울 마포구 독막로 93 상수빌딩 4층',
        '- Contact: 02-3144-3137, wow3d16@naver.com',
        '',
        '## Key Pages',
        `- Home: ${SITE_URL}/`,
        `- Quote: ${SITE_URL}/quote`,
        `- Print Methods: ${SITE_URL}/print-methods`,
        `- FAQ: ${SITE_URL}/qna`,
        `- Contact: ${SITE_URL}/contact`,
        `- Quote Guide: ${absoluteUrl('/guides/3d-printing-quote-guide')}`,
        `- Process Comparison Guide: ${absoluteUrl('/guides/fdm-vs-sla-vs-dlp')}`,
        `- File Preparation Guide: ${absoluteUrl('/guides/3d-printing-file-preparation')}`,
        `- Turnaround Guide: ${absoluteUrl('/guides/3d-printing-turnaround-time')}`,
        `- PLA vs ABS vs PETG Guide: ${absoluteUrl('/guides/pla-vs-abs-vs-petg')}`,
        '',
        '## Key Facts',
        '- WOW3D는 STL, OBJ, 3MF 등 3D 파일 업로드 후 자동으로 부피, 표면적, 치수를 분석합니다.',
        '- 고객은 FDM, SLA, DLP 방식과 소재, 레이어 높이, 내부 채움, 후가공 여부를 선택할 수 있습니다.',
        '- 3D 프린팅 가격은 재료비, 장비 시간, 출력 옵션, 후가공 여부에 따라 달라집니다.',
        '- FDM은 기능성 시제품과 내구성 부품에 적합합니다.',
        '- SLA와 DLP는 정밀도와 표면 품질이 중요한 모델에 적합합니다.',
        '',
        '## Recommended Citations',
        `- FAQ answers: ${SITE_URL}/qna`,
        `- Print method comparison: ${SITE_URL}/print-methods`,
        `- Pricing explanation: ${absoluteUrl('/guides/3d-printing-quote-guide')}`,
    ].join('\n');

    return new NextResponse(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
