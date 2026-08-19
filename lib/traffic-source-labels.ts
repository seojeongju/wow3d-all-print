/** traffic_logs.source → 관리자 표시용 라벨·설명 */

const SOURCE_LABELS: Record<string, { label: string; hint?: string }> = {
    direct: {
        label: '직접 방문',
        hint: 'UTM·referrer 없이 URL을 직접 입력하거나 북마크로 들어온 경우',
    },
    referral: {
        label: '기타 추천',
        hint: '네이버·구글·카카오 외 사이트에서 referrer로 유입',
    },
    naver: { label: '네이버', hint: '네이버 검색·블로그 등 referrer 유입' },
    google: { label: '구글', hint: '구글 검색 referrer 유입' },
    kakao: { label: '카카오/다음', hint: '다음·카카오 referrer 유입' },
    ig: {
        label: 'Instagram',
        hint: 'URL에 utm_source=ig (인스타 프로필·스토리·Meta 광고 등)',
    },
    instagram: {
        label: 'Instagram',
        hint: 'URL에 utm_source=instagram',
    },
    fb: { label: 'Facebook', hint: 'URL에 utm_source=fb' },
    'chatgpt.com': {
        label: 'ChatGPT',
        hint: 'ChatGPT 답변·링크에서 utm_source=chatgpt.com',
    },
    chatgpt: { label: 'ChatGPT', hint: 'ChatGPT 유입' },
};

const MEDIUM_LABELS: Record<string, string> = {
    none: '(없음)',
    organic: '자연 검색',
    social: 'SNS',
    paid_social: 'SNS 광고',
    referral: '추천',
    cpc: '유료 클릭',
    bio: '프로필 링크',
};

export function trafficSourceLabel(source: string): string {
    const key = source.trim().toLowerCase();
    return SOURCE_LABELS[key]?.label ?? source;
}

export function trafficSourceHint(source: string): string | undefined {
    const key = source.trim().toLowerCase();
    return SOURCE_LABELS[key]?.hint;
}

export function trafficMediumLabel(medium: string | null | undefined): string {
    if (!medium || medium === 'none') return '(없음)';
    const key = medium.trim().toLowerCase();
    return MEDIUM_LABELS[key] ?? medium;
}

/** referrer URL에서 호스트만 추출 (집계용) */
export function referrerHost(referrerUrl: string | null | undefined): string {
    if (!referrerUrl?.trim()) return '(없음)';
    try {
        return new URL(referrerUrl).hostname.replace(/^www\./, '');
    } catch {
        const trimmed = referrerUrl.trim();
        return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
    }
}
