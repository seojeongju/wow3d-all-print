import { escapeHtml } from '@/lib/mail-utils';
import { formatEstimatedPrintTime } from '@/lib/print-time-estimate';
import { getSiteUrl } from '@/lib/site-url';
import { formatPrintColor } from '@/lib/print-color';

/** 견적 메일 리마인드 발송 시점 (신청 후) */
export const QUOTE_REMINDER_DELAY_DAYS = 3;
/** 이 기간이 지난 신청은 리마인드하지 않음 (크론이 멈췄다 재개돼도 오래된 메일 방지) */
export const QUOTE_REMINDER_MAX_AGE_DAYS = 14;
/** 개인정보처리방침 제3조: 견적 메일 신청 기록 보유 기간 */
export const QUOTE_EMAIL_RETENTION_DAYS = 90;
/** 같은 견적으로 하루에 보낼 수 있는 메일 수 */
export const QUOTE_EMAIL_MAX_PER_QUOTE_PER_DAY = 3;
/** 같은 주소로 하루에 받을 수 있는 메일 수 (타인 주소 남용 방지) */
export const QUOTE_EMAIL_MAX_PER_ADDRESS_PER_DAY = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeQuoteEmail(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const email = raw.trim().toLowerCase();
    if (email.length > 254 || !EMAIL_RE.test(email)) return null;
    return email;
}

export function generateQuoteEmailToken(): string {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export type QuoteEmailRow = {
    id: number;
    file_name: string;
    print_method: string;
    fdm_material?: string | null;
    fdm_material_name?: string | null;
    resin_type?: string | null;
    resin_type_name?: string | null;
    fdm_infill?: number | null;
    print_color?: string | null;
    print_color_note?: string | null;
    dimensions_x: number;
    dimensions_y: number;
    dimensions_z: number;
    total_price: number;
    estimated_time_hours: number;
};

export type QuoteEmailKind = 'saved' | 'reminder';

type Copy = {
    subject: (fileName: string) => string;
    badge: string;
    heading: string;
    intro: string;
    file: string;
    method: string;
    material: string;
    size: string;
    price: string;
    vat: string;
    time: string;
    cta: string;
    priceNote: string;
    consult: string;
    remindNote: string;
    unsubscribe: string;
    footerReason: string;
};

const COPY: Record<'ko' | 'en', Record<QuoteEmailKind, Copy>> = {
    ko: {
        saved: {
            subject: (f) => `[WOW3D] 요청하신 3D프린팅 견적입니다 — ${f}`,
            badge: '견적 저장 완료',
            heading: '요청하신 견적을 보내 드립니다',
            intro: '아래 버튼을 누르면 같은 파일과 조건으로 견적 화면이 바로 열립니다. 다른 기기에서도 이어서 주문할 수 있어요.',
            file: '파일',
            method: '출력 방식',
            material: '소재',
            size: '출력 크기',
            price: '견적 금액',
            vat: 'VAT 포함',
            time: '예상 출력 시간',
            cta: '견적 이어서 보기',
            priceNote: '견적을 다시 열면 그 시점의 단가로 금액이 새로 계산됩니다.',
            consult: '출력 방식·소재 선택이 고민되면 네이버 톡톡으로 편하게 물어보세요.',
            remindNote: `${QUOTE_REMINDER_DELAY_DAYS}일 뒤 이 견적을 한 번 더 알려 드립니다. 원하지 않으면`,
            unsubscribe: '리마인드 받지 않기',
            footerReason: '이 메일은 WOW3D 자동견적 화면에서 「이메일로 견적 받기」를 신청하셔서 발송되었습니다.',
        },
        reminder: {
            subject: (f) => `(광고) [WOW3D] 저장하신 견적이 기다리고 있어요 — ${f}`,
            badge: '저장한 견적 알림',
            heading: '저장하신 견적, 아직 확인 중이신가요?',
            intro: `${QUOTE_REMINDER_DELAY_DAYS}일 전에 받아 보신 견적을 다시 알려 드립니다. 버튼 한 번이면 같은 조건으로 바로 주문을 이어갈 수 있어요.`,
            file: '파일',
            method: '출력 방식',
            material: '소재',
            size: '출력 크기',
            price: '견적 금액',
            vat: 'VAT 포함',
            time: '예상 출력 시간',
            cta: '견적 이어서 주문하기',
            priceNote: '견적을 다시 열면 그 시점의 단가로 금액이 새로 계산됩니다.',
            consult: '수량·납기·소재 조정이 필요하면 네이버 톡톡이나 02-3144-3137로 문의해 주세요.',
            remindNote: '리마인드는 이번 한 번만 발송됩니다. 앞으로 이런 메일을 받지 않으려면',
            unsubscribe: '수신거부',
            footerReason: '이 메일은 견적 메일 신청 시 리마인드 수신에 동의하셔서 발송되었습니다.',
        },
    },
    en: {
        saved: {
            subject: (f) => `[WOW3D] Your 3D printing quote — ${f}`,
            badge: 'Quote saved',
            heading: 'Here is the quote you requested',
            intro: 'The button below reopens the quote with the same file and settings — on any device.',
            file: 'File',
            method: 'Print method',
            material: 'Material',
            size: 'Print size',
            price: 'Quote',
            vat: 'VAT incl.',
            time: 'Estimated print time',
            cta: 'Continue this quote',
            priceNote: 'Reopening the quote recalculates the price with current rates.',
            consult: 'Not sure about the method or material? Ask us on Naver TalkTalk.',
            remindNote: `We will remind you about this quote once in ${QUOTE_REMINDER_DELAY_DAYS} days. If you prefer not,`,
            unsubscribe: 'turn off the reminder',
            footerReason: 'You received this email because you requested your quote by email on WOW3D.',
        },
        reminder: {
            subject: (f) => `[WOW3D] Your saved quote is waiting — ${f}`,
            badge: 'Saved quote reminder',
            heading: 'Still considering your quote?',
            intro: `Here is the quote you received ${QUOTE_REMINDER_DELAY_DAYS} days ago. One click continues your order with the same settings.`,
            file: 'File',
            method: 'Print method',
            material: 'Material',
            size: 'Print size',
            price: 'Quote',
            vat: 'VAT incl.',
            time: 'Estimated print time',
            cta: 'Continue to order',
            priceNote: 'Reopening the quote recalculates the price with current rates.',
            consult: 'Need a different quantity, deadline or material? Contact us on Naver TalkTalk or +82-2-3144-3137.',
            remindNote: 'This is the only reminder. To stop emails like this,',
            unsubscribe: 'unsubscribe',
            footerReason: 'You received this email because you opted in to a quote reminder on WOW3D.',
        },
    },
};

const SENDER_INFO = {
    ko: '(주)와우쓰리디 · 서울시 마포구 독막로 93 상수빌딩 4층 · 02-3144-3137',
    en: 'WOW3D Co., Ltd. · 4F Sangsu Bldg, 93 Dokmak-ro, Mapo-gu, Seoul · +82-2-3144-3137',
};

const TALKTALK_URL = 'https://talk.naver.com/ct/wowi7tu';

function quoteMaterialLabel(q: QuoteEmailRow, locale: 'ko' | 'en'): string {
    if (q.print_method === 'fdm') {
        const name = q.fdm_material_name || q.fdm_material || '-';
        const color = formatPrintColor(q.print_color, q.print_color_note, locale, name);
        return [name, color, q.fdm_infill ? `${q.fdm_infill}%` : ''].filter(Boolean).join(' · ');
    }
    const resin = q.resin_type_name || q.resin_type || '-';
    const color = formatPrintColor(q.print_color, q.print_color_note, locale, resin);
    return [resin, color].filter(Boolean).join(' · ');
}

function formatSize(q: QuoteEmailRow): string {
    const r = (n: number) => Math.round((Number(n) || 0) * 10) / 10;
    return `${r(q.dimensions_x)} × ${r(q.dimensions_y)} × ${r(q.dimensions_z)} mm`;
}

function formatKrw(amount: number, locale: 'ko' | 'en'): string {
    const n = Math.round(Number(amount) || 0).toLocaleString('ko-KR');
    return locale === 'en' ? `₩${n}` : `${n}원`;
}

export function buildQuoteResumeUrl(quoteId: number, locale: 'ko' | 'en', kind: QuoteEmailKind): string {
    const prefix = locale === 'en' ? '/en' : '';
    const source = kind === 'reminder' ? 'quote_reminder' : 'quote_email';
    return `${getSiteUrl()}${prefix}/quote?load_quote_id=${quoteId}&guide_source=${source}`;
}

export function buildQuoteUnsubscribeUrl(token: string): string {
    return `${getSiteUrl()}/api/quote-reminders/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function buildQuoteEmail(input: {
    kind: QuoteEmailKind;
    locale: 'ko' | 'en';
    quote: QuoteEmailRow;
    /** 리마인드 동의·수신거부 토큰 — 없으면 수신거부 안내 생략 */
    unsubscribeToken?: string | null;
}): { subject: string; text: string; html: string } {
    const { kind, locale, quote } = input;
    const c = COPY[locale][kind];
    const resumeUrl = buildQuoteResumeUrl(quote.id, locale, kind);
    const unsubscribeUrl = input.unsubscribeToken ? buildQuoteUnsubscribeUrl(input.unsubscribeToken) : null;
    const rows: [string, string][] = [
        [c.file, quote.file_name],
        [c.method, String(quote.print_method || '').toUpperCase()],
        [c.material, quoteMaterialLabel(quote, locale)],
        [c.size, formatSize(quote)],
        [c.time, formatEstimatedPrintTime(Number(quote.estimated_time_hours) || 0, locale)],
    ];
    const price = formatKrw(quote.total_price, locale);

    const text = [
        c.heading,
        '',
        c.intro,
        '',
        ...rows.map(([k, v]) => `${k}: ${v}`),
        `${c.price}: ${price} (${c.vat})`,
        '',
        `${c.cta}: ${resumeUrl}`,
        '',
        c.priceNote,
        `${c.consult} ${TALKTALK_URL}`,
        ...(unsubscribeUrl ? ['', `${c.remindNote} ${c.unsubscribe}: ${unsubscribeUrl}`] : []),
        '',
        c.footerReason,
        SENDER_INFO[locale],
    ].join('\n');

    const rowHtml = rows
        .map(
            ([k, v]) => `
                <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 120px; vertical-align: top;">${escapeHtml(k)}</td>
                    <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 600; word-break: break-all;">${escapeHtml(v)}</td>
                </tr>`
        )
        .join('');

    const html = `
        <div style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
            <div style="margin-bottom: 24px;">
                <span style="display: inline-block; padding: 6px 12px; background: #f0fdfa; color: #0d9488; font-size: 11px; font-weight: 800; border-radius: 8px; border: 1px solid #99f6e4;">${escapeHtml(c.badge)}</span>
            </div>
            <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">${escapeHtml(c.heading)}</h2>
            <p style="margin: 0 0 28px; font-size: 14px; color: #475569; line-height: 1.6;">${escapeHtml(c.intro)}</p>

            <div style="margin-bottom: 28px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px 24px;">
                <table style="width: 100%; border-collapse: collapse;">${rowHtml}
                </table>
                <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; color: #64748b;">${escapeHtml(c.price)} (${escapeHtml(c.vat)})</div>
                    <div style="font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">${escapeHtml(price)}</div>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
                <a href="${escapeHtml(resumeUrl)}" style="display: inline-block; padding: 15px 36px; background: #0d9488; color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; border-radius: 12px;">${escapeHtml(c.cta)}</a>
            </div>
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; line-height: 1.6; text-align: center;">${escapeHtml(c.priceNote)}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6; text-align: center;">
                ${escapeHtml(c.consult)} <a href="${TALKTALK_URL}" style="color: #0d9488; font-weight: 700;">TalkTalk</a>
            </p>

            <div style="margin-top: 36px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
                ${
                    unsubscribeUrl
                        ? `<p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px;">${escapeHtml(c.remindNote)} <a href="${escapeHtml(unsubscribeUrl)}" style="color: #64748b;">${escapeHtml(c.unsubscribe)}</a></p>`
                        : ''
                }
                <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px;">${escapeHtml(c.footerReason)}</p>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">${escapeHtml(SENDER_INFO[locale])}</p>
            </div>
        </div>
    `;

    return { subject: c.subject(quote.file_name), text, html };
}
