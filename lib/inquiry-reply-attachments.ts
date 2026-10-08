/** 문의 답변 첨부파일 규칙 (관리자 화면·서버 공용) */

/** 메일에 직접 첨부하므로 수신 메일 서버(네이버·Gmail 약 20~25MB) 한도보다 넉넉히 작게 잡는다 */
export const REPLY_ATTACHMENT_MAX_TOTAL = 10 * 1024 * 1024;
export const REPLY_ATTACHMENT_MAX_COUNT = 10;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'];
const MODEL_EXTENSIONS = ['stl', '3mf', 'step', 'stp', 'obj'];
const OTHER_EXTENSIONS = ['pdf', 'zip'];

export const REPLY_ATTACHMENT_EXTENSIONS = [...IMAGE_EXTENSIONS, ...MODEL_EXTENSIONS, ...OTHER_EXTENSIONS];
export const REPLY_ATTACHMENT_ACCEPT = REPLY_ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(',');
export const REPLY_ATTACHMENT_HINT = '이미지 · PDF · STL/3MF/STEP/OBJ · ZIP';

const CONTENT_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    heic: 'image/heic',
    pdf: 'application/pdf',
    zip: 'application/zip',
    stl: 'model/stl',
    '3mf': 'model/3mf',
    step: 'model/step',
    stp: 'model/step',
    obj: 'model/obj',
};

export type ReplyAttachmentMeta = {
    key: string;
    name: string;
    size: number;
    type: string;
};

export function getFileExtension(name: string): string {
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function isAllowedReplyAttachment(name: string): boolean {
    return REPLY_ATTACHMENT_EXTENSIONS.includes(getFileExtension(name));
}

export function isImageAttachment(name: string): boolean {
    return IMAGE_EXTENSIONS.includes(getFileExtension(name));
}

export function guessAttachmentContentType(name: string, fallback?: string): string {
    return CONTENT_TYPES[getFileExtension(name)] || fallback || 'application/octet-stream';
}

/** 경로 구분자·제어문자를 빼고 메일·다운로드용 파일명으로 정리 */
export function sanitizeAttachmentName(name: string): string {
    const cleaned = name
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();
    return (cleaned || 'attachment').slice(0, 200);
}

export function parseReplyAttachments(raw: unknown): ReplyAttachmentMeta[] {
    if (typeof raw !== 'string' || !raw.trim()) return [];
    try {
        const arr = JSON.parse(raw) as unknown;
        if (!Array.isArray(arr)) return [];
        return arr
            .filter(
                (a): a is ReplyAttachmentMeta =>
                    !!a && typeof a === 'object' && typeof (a as ReplyAttachmentMeta).key === 'string'
            )
            .map((a) => ({
                key: a.key,
                name: typeof a.name === 'string' ? a.name : a.key.split('/').pop() || 'attachment',
                size: Number(a.size) || 0,
                type: typeof a.type === 'string' ? a.type : 'application/octet-stream',
            }));
    } catch {
        return [];
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
