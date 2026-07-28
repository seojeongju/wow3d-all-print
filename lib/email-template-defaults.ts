export const DEFAULT_QUOTATION_TEMPLATE_KEY = 'quotation_default'
export const DEFAULT_QUOTATION_TEMPLATE_ID = 'default-quotation'

export type EmailTemplateRecord = {
  id: number | string
  name: string
  subject: string
  html_content: string | null
  text_content: string | null
  created_at?: string
  updated_at?: string
  template_key?: string | null
  is_system?: number | boolean | null
}

export function getDefaultQuotationTemplateSeed() {
  return {
    id: DEFAULT_QUOTATION_TEMPLATE_ID,
    name: '[기본] 견적서 발송용',
    subject: '[{{주문번호}}] WOW3D 견적서가 준비되었습니다',
    html_content:
      '<p>안녕하세요, WOW3D입니다.</p>\n<p>요청하신 <strong>견적서</strong>가 준비되었습니다.</p>\n<div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">\n  <p style="margin:0 0 8px 0;"><strong>주문번호</strong> {{주문번호}}</p>\n  <p style="margin:0;"><strong>견적 합계</strong> {{견적합계}}</p>\n</div>\n<p><strong>견적서 보기:</strong> <a href="{{견적서링크}}">{{견적서링크}}</a></p>\n<p>위 링크에서 상세 견적 내용을 확인하실 수 있습니다. 확인 후 결제 또는 문의 부탁드립니다.</p>\n<p>감사합니다.<br/>WOW3D</p>',
    text_content:
      '안녕하세요, WOW3D입니다.\n\n요청하신 견적서가 준비되었습니다.\n\n주문번호: {{주문번호}}\n견적 합계: {{견적합계}}\n\n견적서 보기: {{견적서링크}}\n\n위 링크에서 상세 견적 내용을 확인하실 수 있습니다. 확인 후 결제 또는 문의 부탁드립니다.\n\n감사합니다.\nWOW3D',
    template_key: DEFAULT_QUOTATION_TEMPLATE_KEY,
    is_system: 1,
  }
}

export function isDefaultQuotationTemplateId(id: string) {
  return id === DEFAULT_QUOTATION_TEMPLATE_ID
}

export function renderEmailTemplateVariables(
  content: string | null | undefined,
  vars: Record<string, string>
) {
  let out = String(content || '')
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return out
}
