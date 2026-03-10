/**
 * 견적서 이메일 기본 본문/제목 생성 (관리자 편집용 초안 및 발송 시 기본값)
 */

export function buildDefaultSubject(orderNumber: string): string {
    return `[${orderNumber}] WOW3D 견적서가 준비되었습니다`;
}

export function buildDefaultHtml(params: {
    orderNumber: string;
    estimateUrl: string;
    amountText?: string;
    displayAmount?: number | null;
    withPdfAttachment: boolean;
}): string {
    const { orderNumber, estimateUrl, amountText, displayAmount, withPdfAttachment } = params;
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto;padding:20px;} a{color:#2563eb;} .box{background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;}</style></head>
<body>
<p>안녕하세요, WOW3D입니다.</p>
<p>요청하신 <strong>견적서</strong>가 준비되었습니다.</p>
<div class="box">
  <p style="margin:0 0 8px 0;"><strong>주문번호</strong> ${String(orderNumber)}</p>
  ${amountText && displayAmount != null ? `<p style="margin:0;"><strong>견적 합계</strong> ₩${Number(displayAmount).toLocaleString()}</p>` : ''}
</div>
<p><strong>견적서 보기:</strong> <a href="${estimateUrl}">${estimateUrl}</a></p>
${withPdfAttachment ? '<p>견적서 PDF가 본 메일에도 첨부되어 있습니다.</p>' : ''}
<p>위 링크에서 상세 견적 내용을 확인하실 수 있습니다. 확인 후 결제 또는 문의 부탁드립니다.</p>
<p>감사합니다.<br/>WOW3D</p>
</body>
</html>`.trim();
}

/** 견적서 이메일 기본 본문 (일반 텍스트) */
export function buildDefaultText(params: {
    orderNumber: string;
    estimateUrl: string;
    amountText?: string;
    displayAmount?: number | null;
    withPdfAttachment: boolean;
}): string {
    const { orderNumber, estimateUrl, displayAmount, withPdfAttachment } = params;
    const lines: string[] = [
        '안녕하세요, WOW3D입니다.',
        '',
        '요청하신 견적서가 준비되었습니다.',
        '',
        `주문번호: ${orderNumber}`,
        ...(displayAmount != null ? [`견적 합계: ₩${Number(displayAmount).toLocaleString()}`] : []),
        '',
        `견적서 보기: ${estimateUrl}`,
        ...(withPdfAttachment ? ['', '견적서 PDF가 본 메일에도 첨부되어 있습니다.'] : []),
        '',
        '위 링크에서 상세 견적 내용을 확인하실 수 있습니다. 확인 후 결제 또는 문의 부탁드립니다.',
        '',
        '감사합니다.',
        'WOW3D',
    ];
    return lines.join('\n');
}
