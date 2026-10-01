/**
 * 네이버 톡톡 실시간 상담 링크 (클라이언트·서버 공통)
 *
 * NEXT_PUBLIC_NAVER_TALKTALK_ID: 파트너센터 코드 (예: wowi7tu)
 * NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL: 상담 URL (예: https://talk.naver.com/ct/wowi7tu → 상담 대화창 바로 열림)
 * NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID: 파트너센터 배너 data-id (공식 배너 위젯용, 선택)
 */

export function getNaverTalkTalkId(): string | null {
    if (typeof process === 'undefined' || !process.env?.NEXT_PUBLIC_NAVER_TALKTALK_ID) return null;
    const raw = process.env.NEXT_PUBLIC_NAVER_TALKTALK_ID.trim();
    if (!raw) return null;
    return raw.replace(/^\/+/, '');
}

export function getNaverTalkTalkChatUrl(): string | null {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL) {
        const custom = process.env.NEXT_PUBLIC_NAVER_TALKTALK_CHAT_URL.trim();
        if (custom) return custom;
    }

    const id = getNaverTalkTalkId();
    if (!id) return null;

    // 이미 경로면 그대로 (profile/xxx, wc/xxx 등)
    if (id.includes('/')) {
        return `https://talk.naver.com/${id}`;
    }

    // 기본: 상담 대화창 (비로그인 시 네이버 로그인 후 대화창으로 돌아옴)
    return `https://talk.naver.com/ct/${id}`;
}

const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 720;

/**
 * 톡톡 링크 onClick: 데스크톱에서는 작은 채팅 팝업 창으로 연다.
 * 모바일·팝업 차단 시에는 링크 기본 동작(새 창·네이버 앱)을 그대로 쓴다.
 */
export function openNaverTalkTalkPopup(event: { preventDefault: () => void }, url: string): void {
    if (typeof window === 'undefined') return;
    const isDesktop =
        window.matchMedia('(min-width: 768px)').matches && window.matchMedia('(pointer: fine)').matches;
    if (!isDesktop) return;

    const left = Math.max(0, Math.round(window.screenX + window.outerWidth - POPUP_WIDTH - 40));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2));
    const popup = window.open(
        url,
        'wow3d_naver_talktalk',
        `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    if (!popup) return;
    event.preventDefault();
    popup.opener = null;
    popup.focus();
}

export function getNaverTalkTalkBannerId(): string | null {
    if (typeof process === 'undefined' || !process.env?.NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID) return null;
    const raw = process.env.NEXT_PUBLIC_NAVER_TALKTALK_BANNER_ID.trim();
    return raw || null;
}
