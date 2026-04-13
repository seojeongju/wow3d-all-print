/** /expert 쇼케이스 고정 카테고리 (DB slug와 동일) */

export const SHOWCASE_SLUGS = ['industrial', 'medical', 'art', 'architecture'] as const;
export type ShowcaseSlug = (typeof SHOWCASE_SLUGS)[number];

export function isShowcaseSlug(s: string): s is ShowcaseSlug {
    return (SHOWCASE_SLUGS as readonly string[]).includes(s);
}

export type ShowcaseCategoryDefaults = {
    slug: ShowcaseSlug;
    defaultTitle: string;
    defaultDescription: string;
    defaultFeatures: string[];
    /** /public 기준 정적 폴백 이미지 */
    fallbackImage: string;
};

export const SHOWCASE_DEFAULTS: ShowcaseCategoryDefaults[] = [
    {
        slug: 'industrial',
        defaultTitle: '산업용 부품 & 지그(Jig)',
        defaultDescription:
            '최종 생산 라인에 즉시 투입 가능한 고강도 엔지니어링 플라스틱 부품 제조',
        defaultFeatures: ['기능성 검증', '생산 공정 최적화', '경량화 설계'],
        fallbackImage: '/images/expert/industrial.png',
    },
    {
        slug: 'medical',
        defaultTitle: '의료 & 덴탈 솔루션',
        defaultDescription: 'CT/MRI 데이터를 기반으로 한 안면 모델링 및 맞춤형 수술 가이드 제작',
        defaultFeatures: ['생체 적합 소재', '1:1 맞춤 제작', '고정밀 출력'],
        fallbackImage: '/images/expert/medical.png',
    },
    {
        slug: 'art',
        defaultTitle: '아트 & 캐릭터 피규어',
        defaultDescription:
            '복잡한 디테일의 예술 작품 및 게임/애니메이션 캐릭터 풀컬러/고해상도 구현',
        defaultFeatures: ['정밀 디테일', '후가공 전문성', '풀컬러 지원'],
        fallbackImage: '/images/expert/art.png',
    },
    {
        slug: 'architecture',
        defaultTitle: '건축 & 목업(Mock-up)',
        defaultDescription:
            '분양 단지 모형 및 신제품 출시 전 디자인 검토를 위한 화이트 데스크 목업',
        defaultFeatures: ['대형 출력 지원', '정밀 스케일', '재질감 구현'],
        fallbackImage: '/images/expert/architecture.png',
    },
];

export function defaultsForSlug(slug: string): ShowcaseCategoryDefaults | undefined {
    return SHOWCASE_DEFAULTS.find((d) => d.slug === slug);
}

/** R2에 저장된 키 → 공개 미디어 API 경로 (키는 showcase/로 시작) */
export function showcaseMediaUrlFromKey(r2Key: string): string {
    const trimmed = r2Key.replace(/^\/+/, '');
    if (!trimmed.startsWith('showcase/')) {
        return `/api/showcase/media/${trimmed}`;
    }
    return `/api/showcase/media/${trimmed.slice('showcase/'.length)}`;
}

const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const IMAGE_MAX_BYTES = 25 * 1024 * 1024;

const IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
]);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export function validateShowcaseUpload(kind: 'image' | 'video', file: File): string | null {
    const t = (file.type || '').toLowerCase();
    if (kind === 'image') {
        if (!IMAGE_TYPES.has(t)) return '이미지는 JPEG, PNG, WebP, GIF, SVG만 업로드할 수 있습니다.';
        if (file.size > IMAGE_MAX_BYTES) return '이미지는 25MB 이하만 가능합니다.';
    } else {
        if (!VIDEO_TYPES.has(t)) return '영상은 MP4, WebM, MOV만 업로드할 수 있습니다.';
        if (file.size > VIDEO_MAX_BYTES) return '영상은 100MB 이하만 가능합니다.';
    }
    return null;
}

export function extFromFile(file: File, kind: 'image' | 'video'): string {
    const fromName = file.name.split('.').pop();
    if (fromName && /^[a-z0-9]+$/i.test(fromName) && fromName.length <= 8) {
        return fromName.toLowerCase();
    }
    if (kind === 'video') {
        if (file.type.includes('webm')) return 'webm';
        if (file.type.includes('quicktime')) return 'mov';
        return 'mp4';
    }
    if (file.type.includes('png')) return 'png';
    if (file.type.includes('webp')) return 'webp';
    if (file.type.includes('gif')) return 'gif';
    if (file.type.includes('svg')) return 'svg';
    return 'jpg';
}

export function parseFeaturesJson(raw: string | null | undefined): string[] {
    if (!raw || !raw.trim()) return [];
    try {
        const v = JSON.parse(raw) as unknown;
        if (!Array.isArray(v)) return [];
        return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
    } catch {
        return [];
    }
}
