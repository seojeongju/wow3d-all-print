/** 관리자 상세 HTML → 공개 노출용 단순 새니타이즈 (스크립트/이벤트 제거) */
const ALLOWED_TAGS = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'h1',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'blockquote',
    'hr',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'span',
    'div',
    'figure',
    'figcaption',
])

const ALLOWED_ATTRS = new Set([
    'href',
    'src',
    'alt',
    'title',
    'class',
    'style',
    'target',
    'rel',
    'width',
    'height',
    'colspan',
    'rowspan',
])

export function isProbablyHtml(text: string): boolean {
    return /<\/?[a-z][\s\S]*>/i.test(text.trim())
}

/** 평문을 단락 HTML로 변환 */
export function plainTextToHtml(text: string): string {
    const lines = text.split(/\n/).map((l) => l.trim())
    if (lines.every((l) => !l)) return '<p></p>'
    return lines.map((l) => (l ? `<p>${escapeHtml(l)}</p>` : '<p><br></p>')).join('')
}

export function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

export function detailBodyToEditorHtml(raw: string): string {
    const t = (raw || '').trim()
    if (!t) return '<p></p>'
    if (isProbablyHtml(t)) return t
    return plainTextToHtml(raw)
}

export function sanitizeDetailHtml(dirty: string): string {
    // SSR: 스크립트·고정폭 스타일 제거
    const ssrClean = dirty
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\s(?:width|height)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(
            /(style\s*=\s*")([^"]*)(")/gi,
            (_m, open: string, css: string, close: string) => {
                const cleaned = css
                    .replace(/(?:min-|max-)?width\s*:\s*[^;]+;?/gi, '')
                    .replace(/white-space\s*:\s*nowrap;?/gi, '')
                    .trim()
                    .replace(/^;+|;+$/g, '')
                return cleaned ? `${open}${cleaned}${close}` : ''
            }
        )

    if (typeof window === 'undefined') {
        return ssrClean
    }

    const doc = new DOMParser().parseFromString(`<div id="root">${ssrClean}</div>`, 'text/html')
    const root = doc.getElementById('root')
    if (!root) return ''

    const walk = (node: Node) => {
        const children = Array.from(node.childNodes)
        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child as HTMLElement
                const tag = el.tagName.toLowerCase()
                if (!ALLOWED_TAGS.has(tag)) {
                    // unwrap: keep children
                    while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el)
                    el.remove()
                    continue
                }
                for (const attr of Array.from(el.attributes)) {
                    const name = attr.name.toLowerCase()
                    if (!ALLOWED_ATTRS.has(name)) {
                        el.removeAttribute(attr.name)
                        continue
                    }
                    if (name === 'href' || name === 'src') {
                        const v = attr.value.trim().toLowerCase()
                        if (v.startsWith('javascript:') || v.startsWith('data:text/html')) {
                            el.removeAttribute(attr.name)
                        }
                    }
                    if (name === 'style') {
                        // drop expression/url javascript
                        if (/expression|javascript:/i.test(attr.value)) {
                            el.removeAttribute('style')
                            continue
                        }
                        // 모바일 오버플로우 유발 고정 폭 제거
                        const cleaned = attr.value
                            .replace(/(?:min-|max-)?width\s*:\s*[^;]+;?/gi, '')
                            .replace(/white-space\s*:\s*nowrap;?/gi, '')
                            .trim()
                            .replace(/^;+|;+$/g, '')
                        if (cleaned) el.setAttribute('style', cleaned)
                        else el.removeAttribute('style')
                    }
                }
                if (tag === 'img') {
                    el.removeAttribute('width')
                    el.removeAttribute('height')
                    el.style.maxWidth = '100%'
                    el.style.height = 'auto'
                }
                if (tag === 'a') {
                    el.setAttribute('rel', 'noopener noreferrer')
                    if (!el.getAttribute('target')) el.setAttribute('target', '_blank')
                }
                walk(el)
            }
        }
    }

    walk(root)
    return root.innerHTML
}
