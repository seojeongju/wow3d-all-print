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
    if (typeof window === 'undefined') {
        // SSR: 스크립트 태그만 제거
        return dirty
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    }

    const doc = new DOMParser().parseFromString(`<div id="root">${dirty}</div>`, 'text/html')
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
                        }
                    }
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
