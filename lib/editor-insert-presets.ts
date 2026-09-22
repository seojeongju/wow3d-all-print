/** 스마트 에디터 삽입용 프리셋 (이모지·특수문자·형광펜) */

export type CharGroup = {
    id: string
    label: string
    chars: string[]
}

export const EMOJI_GROUPS: CharGroup[] = [
    {
        id: 'gift',
        label: '선물·축하',
        chars: ['🎁', '🎀', '🎉', '🎊', '🎈', '🎂', '🍰', '🥳', '✨', '⭐', '🌟', '💫'],
    },
    {
        id: 'emotion',
        label: '감정',
        chars: ['😊', '😍', '🥰', '😎', '🤗', '👍', '👏', '🙌', '💪', '❤️', '💙', '💚'],
    },
    {
        id: 'product',
        label: '제품·제작',
        chars: ['🖨️', '🧩', '🔧', '⚙️', '🛠️', '📦', '🚚', '🚗', '🔑', '🏠', '💡', '🔬'],
    },
    {
        id: 'mark',
        label: '표시',
        chars: ['✅', '❌', '⚠️', '❗', '❓', '📌', '🔥', '💯', '🆕', '🆗', '➡️', '⬇️'],
    },
]

export const SPECIAL_CHAR_GROUPS: CharGroup[] = [
    {
        id: 'punct',
        label: '문장부호',
        chars: ['·', '•', '…', '※', '★', '☆', '◆', '◇', '■', '□', '▲', '▼', '←', '→', '↑', '↓'],
    },
    {
        id: 'math',
        label: '기호',
        chars: ['±', '×', '÷', '≈', '≠', '≤', '≥', '∞', '℃', '℉', '㎜', '㎝', '㎡', '㎥', '％', '‰'],
    },
    {
        id: 'currency',
        label: '통화·단위',
        chars: ['₩', '￦', '$', '€', '£', '¥', '℃', '°', '№', '§', '†', '‡'],
    },
    {
        id: 'brackets',
        label: '괄호',
        chars: ['「', '」', '『', '』', '【', '】', '〈', '〉', '《', '》', '〔', '〕', '‹', '›', '«', '»'],
    },
    {
        id: 'dash',
        label: '줄·공백',
        chars: ['—', '–', '―', '‾', '＿', '﹏', '～', '〜', '〃', '〆', '〇', '〒'],
    },
]

export const HIGHLIGHT_COLORS: { label: string; value: string }[] = [
    { label: '노랑', value: '#fff59d' },
    { label: '연두', value: '#c8e6c9' },
    { label: '하늘', value: '#b3e5fc' },
    { label: '분홍', value: '#f8bbd0' },
    { label: '주황', value: '#ffe0b2' },
    { label: '보라', value: '#e1bee7' },
    { label: '회색', value: '#eceff1' },
]

/** YouTube URL / short / embed → video id */
export function extractYoutubeId(raw: string): string | null {
    const input = raw.trim()
    if (!input) return null
    if (/^[\w-]{11}$/.test(input)) return input
    try {
        const u = new URL(input)
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.replace(/^\//, '').slice(0, 11)
            return /^[\w-]{11}$/.test(id) ? id : null
        }
        if (u.hostname.includes('youtube.com')) {
            const v = u.searchParams.get('v')
            if (v && /^[\w-]{11}$/.test(v)) return v
            const m = u.pathname.match(/\/(?:embed|shorts)\/([\w-]{11})/)
            if (m) return m[1]
        }
    } catch {
        /* ignore */
    }
    const loose = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)
    return loose ? loose[1] : null
}

export function youtubeEmbedHtml(videoId: string): string {
    const src = `https://www.youtube.com/embed/${videoId}`
    return (
        `<div class="detail-youtube" data-youtube-id="${videoId}" contenteditable="false">` +
        `<iframe src="${src}" title="YouTube video" loading="lazy" ` +
        `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ` +
        `allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><p></p>`
    )
}
