'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { NodeSelection } from '@tiptap/pm/state'
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Check,
    CheckSquare,
    Code2,
    Heading2,
    Highlighter,
    Image as ImageIcon,
    Italic,
    Link2,
    List,
    ListOrdered,
    Minus,
    Omega,
    Plus,
    Quote,
    Redo2,
    Smile,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
    X,
    Library,
    Table2,
    Youtube,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { detailBodyToEditorHtml, sanitizeDetailHtml } from '@/lib/sanitize-html'
import {
    EMOJI_GROUPS,
    HIGHLIGHT_COLORS,
    SPECIAL_CHAR_GROUPS,
    extractYoutubeId,
    youtubeEmbedHtml,
} from '@/lib/editor-insert-presets'
import { CharInsertPopover, HighlightColorPopover } from './EditorCharPickers'

const FONT_DEFAULT = '__default__'

const FONT_FAMILIES: { label: string; value: string }[] = [
    { label: '기본', value: FONT_DEFAULT },
    { label: '맑은 고딕', value: '"Malgun Gothic", "맑은 고딕", sans-serif' },
    { label: '돋움', value: 'Dotum, "돋움", sans-serif' },
    { label: '굴림', value: 'Gulim, "굴림", sans-serif' },
    { label: '바탕', value: 'Batang, "바탕", serif' },
    { label: '나눔고딕', value: '"Nanum Gothic", "나눔고딕", sans-serif' },
    { label: '나눔명조', value: '"Nanum Myeongjo", "나눔명조", serif' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' },
]

const FONT_SIZES = ['12px', '14px', '15px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']
const SIZE_DEFAULT = '__default__'

/** 표 전체 가운데/오른쪽 정렬(data-align) + 노드 선택 가능 */
const EditorTable = Table.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            align: {
                default: 'left',
                parseHTML: (element: HTMLElement) => {
                    const data = element.getAttribute('data-align')
                    if (data === 'center' || data === 'right' || data === 'left') return data
                    const style = element.getAttribute('style') || ''
                    if (/margin-left:\s*auto/i.test(style) && /margin-right:\s*auto/i.test(style)) {
                        return 'center'
                    }
                    if (/margin-left:\s*auto/i.test(style)) return 'right'
                    return 'left'
                },
                renderHTML: (attributes: { align?: string | null }) => {
                    if (!attributes.align || attributes.align === 'left') {
                        return { 'data-align': 'left' }
                    }
                    if (attributes.align === 'center') {
                        return {
                            'data-align': 'center',
                            style: 'margin-left: auto; margin-right: auto; width: auto; max-width: 100%;',
                        }
                    }
                    return {
                        'data-align': 'right',
                        style: 'margin-left: auto; margin-right: 0; width: auto; max-width: 100%;',
                    }
                },
            },
        }
    },
}).configure({
    resizable: false,
    allowTableNodeSelection: true,
})

function isTableNodeSelected(editor: Editor | null): boolean {
    if (!editor || editor.isDestroyed) return false
    const { selection } = editor.state
    return selection instanceof NodeSelection && selection.node.type.name === 'table'
}

function selectCurrentTable(editor: Editor): boolean {
    const { selection } = editor.state
    if (selection instanceof NodeSelection && selection.node.type.name === 'table') {
        return true
    }
    const $from = selection.$from
    for (let depth = $from.depth; depth > 0; depth -= 1) {
        if ($from.node(depth).type.name === 'table') {
            return editor.chain().focus().setNodeSelection($from.before(depth)).run()
        }
    }
    return false
}

function normalizeFontFamily(raw: string | null | undefined): string {
    if (!raw) return FONT_DEFAULT
    const compact = raw.replace(/\s+/g, ' ').trim()
    const found = FONT_FAMILIES.find(
        (f) => f.value !== FONT_DEFAULT && f.value.replace(/\s+/g, ' ') === compact
    )
    return found?.value || compact
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('파일을 읽지 못했습니다'))
        reader.readAsDataURL(file)
    })
}

function keepEditorSelection(e: ReactMouseEvent) {
    // 버튼 클릭으로 에디터 포커스/선택이 풀리면 bold·링크·글꼴 등이 무반응처럼 보임
    // ※ native <select>에는 쓰면 안 됨 — preventDefault가 드롭다운 자체를 막음
    e.preventDefault()
}

function ToolBtn({
    active,
    disabled,
    title,
    onClick,
    children,
}: {
    active?: boolean
    disabled?: boolean
    title: string
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onMouseDown={(e) => {
                keepEditorSelection(e)
                // click 전에 blur되면 선택이 날아가므로 mousedown에서 바로 실행
                if (!disabled) onClick()
            }}
            className={cn(
                'h-8 min-w-8 px-1.5 rounded inline-flex items-center justify-center text-[#333] hover:bg-[#f0f1f3] disabled:opacity-30',
                active && 'bg-[#e8f8ef] text-[#03c75a]'
            )}
        >
            {children}
        </button>
    )
}

function InsertBtn({
    icon: Icon,
    label,
    onClick,
    active,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    active?: boolean
}) {
    return (
        <button
            type="button"
            onMouseDown={keepEditorSelection}
            onClick={onClick}
            className={cn(
                'flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[#f0f1f3] text-[#333] min-w-[52px]',
                active && 'bg-[#e8f8ef] text-[#03c75a]'
            )}
        >
            <Icon className="w-5 h-5" />
            <span className="text-[11px] font-bold">{label}</span>
        </button>
    )
}

export default function DetailSmartEditor({
    initialHtml,
    productTitle,
    onUploadImage,
    onClose,
    onRegister,
}: {
    initialHtml: string
    productTitle?: string
    onUploadImage?: (file: File) => Promise<string | null>
    onClose: () => void
    onRegister: (html: string) => void | Promise<void>
}) {
    const fileRef = useRef<HTMLInputElement>(null)
    const hydratedRef = useRef(false)
    const insertImageRef = useRef<((file: File) => Promise<void>) | null>(null)
    /** <select> 열 때 에디터 blur로 사라지는 선택 영역 복원용 */
    const savedSelectionRef = useRef<{ from: number; to: number } | null>(null)
    const [saveCount, setSaveCount] = useState(0)
    const [showHtml, setShowHtml] = useState(false)
    const [htmlDraft, setHtmlDraft] = useState('')
    const [uploading, setUploading] = useState(false)
    const [sidebar, setSidebar] = useState<'none' | 'library' | 'template' | 'blocks'>('none')
    const [registering, setRegistering] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [picker, setPicker] = useState<'none' | 'emoji' | 'special' | 'highlight'>('none')
    const initialContent = detailBodyToEditorHtml(initialHtml)

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        extensions: [
            // TipTap v3 StarterKit에 link·underline 포함 — 별도 등록 시 중복 경고/오류
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                link: {
                    openOnClick: false,
                    HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
                },
            }),
            TextStyle,
            FontFamily,
            FontSize,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({
                allowBase64: true,
                inline: false,
                HTMLAttributes: { class: 'detail-editor-img' },
            }),
            Placeholder.configure({
                placeholder: '내용을 입력하세요.',
                showOnlyWhenEditable: true,
                showOnlyCurrent: true,
            }),
            // resizable은 추가 CSS/플러그인 의존이 있어 크롬 일부 환경에서 오류를 유발할 수 있음
            EditorTable,
            TableRow,
            TableHeader,
            TableCell,
            TaskList,
            TaskItem.configure({ nested: true }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class:
                    'detail-smart-editor prose prose-neutral max-w-none min-h-[70vh] px-10 py-12 focus:outline-none text-[15px] leading-relaxed text-[#1e2124]',
            },
            handleDrop: (_view, event, _slice, moved) => {
                if (moved) return false
                const files = event.dataTransfer?.files
                if (!files?.length) return false
                const image = Array.from(files).find((f) => f.type.startsWith('image/'))
                if (!image) return false
                event.preventDefault()
                void insertImageRef.current?.(image)
                return true
            },
            handlePaste: (_view, event) => {
                const items = event.clipboardData?.items
                if (!items) return false
                for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                        const file = item.getAsFile()
                        if (file) {
                            event.preventDefault()
                            void insertImageRef.current?.(file)
                            return true
                        }
                    }
                }
                return false
            },
        },
    })

    const exitHtmlMode = useCallback(() => {
        if (!showHtml || !editor || editor.isDestroyed) return
        editor.commands.setContent(htmlDraft || '<p></p>', { emitUpdate: false })
        setShowHtml(false)
    }, [editor, htmlDraft, showHtml])

    const withEditor = useCallback(
        (fn: (ed: NonNullable<typeof editor>) => void) => {
            if (!editor || editor.isDestroyed) return
            if (showHtml) {
                editor.commands.setContent(htmlDraft || '<p></p>', { emitUpdate: false })
                setShowHtml(false)
            }
            fn(editor)
        },
        [editor, htmlDraft, showHtml]
    )

    const captureEditorSelection = useCallback(() => {
        if (!editor || editor.isDestroyed) return
        const { from, to } = editor.state.selection
        savedSelectionRef.current = { from, to }
    }, [editor])

    const withCapturedSelection = useCallback(
        (fn: (ed: NonNullable<typeof editor>) => void) => {
            withEditor((ed) => {
                const sel = savedSelectionRef.current
                if (sel) {
                    const docSize = ed.state.doc.content.size
                    const from = Math.max(0, Math.min(sel.from, docSize))
                    const to = Math.max(0, Math.min(sel.to, docSize))
                    try {
                        ed.chain().focus().setTextSelection({ from, to }).run()
                    } catch {
                        ed.chain().focus().run()
                    }
                } else {
                    ed.chain().focus().run()
                }
                fn(ed)
            })
        },
        [withEditor]
    )

    // 열릴 때 1회만 본문 주입 (업로드/저장으로 initialHtml이 바뀌어도 편집 중 내용 유지)
    useEffect(() => {
        if (!editor || hydratedRef.current) return
        editor.commands.setContent(detailBodyToEditorHtml(initialHtml), { emitUpdate: false })
        hydratedRef.current = true
    }, [editor, initialHtml])

    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [])

    const getHtml = useCallback(() => {
        if (!editor) return detailBodyToEditorHtml(initialHtml)
        return sanitizeDetailHtml(editor.getHTML())
    }, [editor, initialHtml])

    const insertImage = useCallback(
        async (file: File) => {
            if (!editor || editor.isDestroyed) return
            if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
                setUploadError('이미지 파일만 삽입할 수 있습니다.')
                return
            }
            setUploadError(null)
            setUploading(true)
            try {
                const dataUrl = await readFileAsDataUrl(file)
                const stamp = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

                // 이미지가 선택된 상태면 setImage가 교체하므로, 선택 해제 후 새 노드로 삽입
                if (editor.isActive('image')) {
                    const to = editor.state.selection.to
                    editor.commands.setTextSelection(to)
                }

                editor
                    .chain()
                    .focus()
                    .insertContent([
                        {
                            type: 'image',
                            attrs: { src: dataUrl, alt: file.name, title: stamp },
                        },
                        { type: 'paragraph' },
                    ])
                    .run()

                if (onUploadImage) {
                    try {
                        const remote = await onUploadImage(file)
                        if (remote && !editor.isDestroyed) {
                            let replaced = false
                            editor.state.doc.descendants((node, pos) => {
                                if (replaced) return false
                                if (
                                    node.type.name === 'image' &&
                                    (node.attrs.title === stamp || node.attrs.src === dataUrl)
                                ) {
                                    const after = pos + node.nodeSize
                                    editor
                                        .chain()
                                        .command(({ tr }) => {
                                            tr.setNodeMarkup(pos, undefined, {
                                                ...node.attrs,
                                                src: remote,
                                                alt: file.name,
                                                title: null,
                                            })
                                            return true
                                        })
                                        .setTextSelection(Math.min(after, editor.state.doc.content.size))
                                        .run()
                                    replaced = true
                                    return false
                                }
                                return true
                            })
                        }
                    } catch (e) {
                        console.warn('detail image upload', e)
                        setUploadError(
                            e instanceof Error
                                ? `업로드 실패(미리보기는 유지): ${e.message}`
                                : '업로드 실패. 미리보기는 유지됩니다.'
                        )
                    }
                }
            } catch (e) {
                setUploadError(e instanceof Error ? e.message : '이미지 삽입에 실패했습니다.')
            } finally {
                setUploading(false)
            }
        },
        [editor, onUploadImage]
    )

    insertImageRef.current = insertImage

    const handleSave = () => {
        setSaveCount((c) => c + 1)
    }

    const handleRegister = async () => {
        if (showHtml) {
            editor?.commands.setContent(htmlDraft || '<p></p>', { emitUpdate: false })
        }
        setRegistering(true)
        try {
            await onRegister(getHtml())
        } finally {
            setRegistering(false)
        }
    }

    const applyBlockType = (v: 'p' | 'h1' | 'h2' | 'h3') => {
        withCapturedSelection((ed) => {
            if (v === 'p') {
                ed.chain().focus().setParagraph().run()
                return
            }
            const level = (v === 'h1' ? 1 : v === 'h2' ? 2 : 3) as 1 | 2 | 3
            ed.chain().focus().setHeading({ level }).run()
        })
    }

    const applyFontFamily = (v: string) => {
        withCapturedSelection((ed) => {
            if (v === FONT_DEFAULT || !v) {
                ed.chain().focus().extendMarkRange('textStyle').unsetFontFamily().run()
                return
            }
            ed.chain().focus().setFontFamily(v).run()
        })
    }

    const applyFontSize = (v: string) => {
        withCapturedSelection((ed) => {
            if (v === SIZE_DEFAULT || !v) {
                ed.chain().focus().extendMarkRange('textStyle').unsetFontSize().run()
                return
            }
            ed.chain().focus().setFontSize(v).run()
        })
    }

    const setLink = () => {
        withEditor((ed) => {
            const prev = ed.getAttributes('link').href as string | undefined
            const url = window.prompt('링크 URL', prev || 'https://')
            if (url === null) return
            if (!url.trim()) {
                ed.chain().focus().extendMarkRange('link').unsetLink().run()
                return
            }
            const href = url.trim()
            const { empty } = ed.state.selection
            if (empty) {
                const label = href.replace(/^https?:\/\//i, '')
                ed.chain()
                    .focus()
                    .insertContent({
                        type: 'text',
                        text: label,
                        marks: [{ type: 'link', attrs: { href } }],
                    })
                    .run()
                return
            }
            ed.chain().focus().extendMarkRange('link').setLink({ href }).run()
        })
    }

    const insertTable = () => {
        withEditor((ed) => {
            ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        })
    }

    const insertPlainChar = (ch: string) => {
        withEditor((ed) => {
            ed.chain().focus().insertContent(ch).run()
        })
    }

    const insertYoutube = () => {
        withEditor((ed) => {
            const raw = window.prompt('YouTube URL 또는 영상 ID', 'https://www.youtube.com/watch?v=')
            if (raw === null) return
            const id = extractYoutubeId(raw)
            if (!id) {
                window.alert('유효한 YouTube 링크를 입력해 주세요.')
                return
            }
            ed.chain().focus().insertContent(youtubeEmbedHtml(id)).run()
        })
    }

    const applyHighlight = (color: string) => {
        withEditor((ed) => {
            ed.chain().focus().toggleHighlight({ color }).run()
        })
        setPicker('none')
    }

    const clearHighlight = () => {
        withEditor((ed) => {
            ed.chain().focus().unsetHighlight().run()
        })
        setPicker('none')
    }

    const applyAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
        withEditor((ed) => {
            if (isTableNodeSelected(ed)) {
                if (align === 'justify') return
                ed.chain().focus().updateAttributes('table', { align }).run()
                return
            }
            // 표 안: 셀(td/th) align + 단락 textAlign 동시 적용 → 공개 페이지에서도 유지
            if (ed.isActive('table')) {
                const cellAlign = align === 'justify' ? null : align
                ed.chain().focus().setCellAttribute('align', cellAlign).setTextAlign(align).run()
                return
            }
            ed.chain().focus().setTextAlign(align).run()
        })
    }

    const tableNodeSelected = isTableNodeSelected(editor)
    const tableAlign = (editor?.getAttributes('table').align as string | undefined) || 'left'
    const alignActive = (align: 'left' | 'center' | 'right' | 'justify') => {
        if (tableNodeSelected) return align !== 'justify' && tableAlign === align
        if (editor?.isActive('table')) {
            const cellAlign =
                (editor.getAttributes('tableCell').align as string | undefined) ||
                (editor.getAttributes('tableHeader').align as string | undefined)
            if (cellAlign) return cellAlign === align
        }
        return !!editor?.isActive({ textAlign: align })
    }

    const CONTENT_BLOCKS: { id: string; label: string; html: string }[] = [
        {
            id: 'title-body',
            label: '제목 + 본문',
            html: '<h2>섹션 제목</h2><p>여기에 설명을 입력하세요.</p>',
        },
        {
            id: 'quote',
            label: '강조 인용',
            html: '<blockquote><p>고객에게 전달할 핵심 메시지를 적어 주세요.</p></blockquote><p></p>',
        },
        {
            id: 'callout-tip',
            label: '팁 박스',
            html: '<div class="detail-callout detail-callout-tip"><p><strong>💡 TIP</strong> — 고객에게 알려줄 팁을 적어 주세요.</p></div><p></p>',
        },
        {
            id: 'callout-warn',
            label: '주의 박스',
            html: '<div class="detail-callout detail-callout-warn"><p><strong>⚠️ 주의</strong> — 확인이 필요한 안내를 적어 주세요.</p></div><p></p>',
        },
        {
            id: 'callout-info',
            label: '안내 박스',
            html: '<div class="detail-callout detail-callout-info"><p><strong>ℹ️ 안내</strong> — 배송·제작 안내 문구를 적어 주세요.</p></div><p></p>',
        },
        {
            id: 'badge-row',
            label: '배지 행',
            html: '<p style="text-align: center"><span class="detail-badge">맞춤 제작</span> <span class="detail-badge detail-badge-teal">빠른 출고</span> <span class="detail-badge detail-badge-pink">선물 추천</span></p><p></p>',
        },
        {
            id: 'cta',
            label: '문의 CTA',
            html: '<p style="text-align: center"><a class="detail-cta" href="/contact">지금 문의하기</a></p><p></p>',
        },
        {
            id: 'checklist',
            label: '체크 리스트',
            html: '<h3>확인 사항</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>항목 1</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>항목 2</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>항목 3</p></div></li></ul><p></p>',
        },
        {
            id: 'steps',
            label: '진행 단계',
            html: '<h3>이용 순서</h3><ol><li>옵션을 선택합니다.</li><li>견적·문의를 진행합니다.</li><li>제작·배송을 안내드립니다.</li></ol><p></p>',
        },
        {
            id: 'divider',
            label: '구분선 + 여백',
            html: '<hr><p></p>',
        },
    ]

    const insertContentBlock = (html: string) => {
        withEditor((ed) => {
            ed.chain().focus().insertContent(html).run()
            setSidebar('none')
        })
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#f4f5f7] text-[#1e2124]">
            {/* 상단 헤더 */}
            <header className="shrink-0 border-b border-[#e5e8eb] bg-white">
                <div className="h-12 px-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-black text-[#03c75a]">WOW3D</span>
                        <span className="text-[#d1d5db]">|</span>
                        <span className="text-[13px] font-bold text-[#555] truncate">
                            상세페이지 구성{productTitle ? ` · ${productTitle}` : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="h-8 px-3 rounded border border-[#d1d5db] bg-[#f7f8fa] text-[12px] font-bold text-[#555] hover:bg-[#eef0f2]"
                        >
                            임시저장 | {saveCount}
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleRegister()}
                            disabled={registering}
                            className="h-8 px-5 rounded bg-[#03c75a] text-white text-[13px] font-black inline-flex items-center gap-1.5 hover:bg-[#02b351] disabled:opacity-60 shadow-sm"
                        >
                            <Check className="w-4 h-4" />
                            {registering ? '반영 중…' : '완료'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-8 w-8 rounded border border-[#d1d5db] inline-flex items-center justify-center text-[#868b94] hover:bg-[#f0f1f3]"
                            aria-label="닫기"
                            title="저장하지 않고 닫기"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 삽입 툴바 */}
                <div className="px-3 py-1.5 flex items-center justify-between gap-2 border-t border-[#f0f1f3]">
                    <div className="flex items-center gap-0.5 min-w-0 flex-1 overflow-x-auto pb-0.5">
                        <InsertBtn
                            icon={ImageIcon}
                            label="사진"
                            onClick={() => {
                                exitHtmlMode()
                                fileRef.current?.click()
                            }}
                        />
                        <InsertBtn
                            icon={Quote}
                            label="인용구"
                            onClick={() =>
                                withEditor((ed) => ed.chain().focus().toggleBlockquote().run())
                            }
                        />
                        <InsertBtn
                            icon={Minus}
                            label="구분선"
                            onClick={() =>
                                withEditor((ed) => ed.chain().focus().setHorizontalRule().run())
                            }
                        />
                        <InsertBtn icon={Link2} label="링크" onClick={setLink} />
                        <InsertBtn icon={Table2} label="표" onClick={insertTable} />
                        <InsertBtn icon={Youtube} label="영상" onClick={insertYoutube} />
                        <InsertBtn
                            icon={Code2}
                            label="HTML"
                            active={showHtml}
                            onClick={() => {
                                if (!editor) return
                                if (!showHtml) {
                                    setHtmlDraft(editor.getHTML())
                                    setShowHtml(true)
                                } else {
                                    editor.commands.setContent(htmlDraft || '<p></p>')
                                    setShowHtml(false)
                                }
                            }}
                        />
                        <InsertBtn
                            icon={Plus}
                            label="블록"
                            active={sidebar === 'blocks'}
                            onClick={() =>
                                setSidebar((s) => (s === 'blocks' ? 'none' : 'blocks'))
                            }
                        />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                        <div className="relative">
                            <InsertBtn
                                icon={Smile}
                                label="이모지"
                                active={picker === 'emoji'}
                                onClick={() =>
                                    setPicker((p) => (p === 'emoji' ? 'none' : 'emoji'))
                                }
                            />
                            <CharInsertPopover
                                title="이모지 삽입"
                                groups={EMOJI_GROUPS}
                                open={picker === 'emoji'}
                                onClose={() => setPicker('none')}
                                onPick={insertPlainChar}
                                anchorClassName="right-0"
                            />
                        </div>
                        <div className="relative">
                            <InsertBtn
                                icon={Omega}
                                label="특수문자"
                                active={picker === 'special'}
                                onClick={() =>
                                    setPicker((p) => (p === 'special' ? 'none' : 'special'))
                                }
                            />
                            <CharInsertPopover
                                title="특수문자 삽입"
                                groups={SPECIAL_CHAR_GROUPS}
                                open={picker === 'special'}
                                onClose={() => setPicker('none')}
                                onPick={insertPlainChar}
                                anchorClassName="right-0"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onMouseDown={keepEditorSelection}
                            onClick={() =>
                                setSidebar((s) => (s === 'library' ? 'none' : 'library'))
                            }
                            className={cn(
                                'h-8 px-2.5 rounded text-[12px] font-bold inline-flex items-center gap-1',
                                sidebar === 'library'
                                    ? 'bg-[#e8f8ef] text-[#03c75a]'
                                    : 'text-[#555] hover:bg-[#f0f1f3]'
                            )}
                        >
                            <Library className="w-3.5 h-3.5" />
                            라이브러리
                        </button>
                        <button
                            type="button"
                            onMouseDown={keepEditorSelection}
                            onClick={() =>
                                setSidebar((s) => (s === 'template' ? 'none' : 'template'))
                            }
                            className={cn(
                                'h-8 px-2.5 rounded text-[12px] font-bold',
                                sidebar === 'template'
                                    ? 'bg-[#e8f8ef] text-[#03c75a]'
                                    : 'text-[#555] hover:bg-[#f0f1f3]'
                            )}
                        >
                            템플릿
                        </button>
                    </div>
                </div>

                {/* 서식 툴바 */}
                <div className="px-3 py-1.5 flex flex-wrap items-center gap-0.5 border-t border-[#f0f1f3]">
                    <select
                        className="h-8 rounded border border-[#e5e8eb] text-[12px] font-bold px-2 mr-1 bg-white"
                        title="단락 스타일"
                        onMouseDown={captureEditorSelection}
                        onFocus={captureEditorSelection}
                        value={
                            editor?.isActive('heading', { level: 1 })
                                ? 'h1'
                                : editor?.isActive('heading', { level: 2 })
                                  ? 'h2'
                                  : editor?.isActive('heading', { level: 3 })
                                    ? 'h3'
                                    : 'p'
                        }
                        onChange={(e) => {
                            applyBlockType(e.target.value as 'p' | 'h1' | 'h2' | 'h3')
                        }}
                    >
                        <option value="p">본문</option>
                        <option value="h1">제목1</option>
                        <option value="h2">제목2</option>
                        <option value="h3">제목3</option>
                    </select>

                    <select
                        className="h-8 max-w-[130px] rounded border border-[#e5e8eb] text-[12px] font-bold px-2 mr-1 bg-white"
                        title="글꼴"
                        onMouseDown={captureEditorSelection}
                        onFocus={captureEditorSelection}
                        value={normalizeFontFamily(
                            (editor?.getAttributes('textStyle').fontFamily as string | undefined) ||
                                ''
                        )}
                        onChange={(e) => applyFontFamily(e.target.value)}
                    >
                        {FONT_FAMILIES.map((f) => (
                            <option key={f.label} value={f.value}>
                                {f.label}
                            </option>
                        ))}
                    </select>

                    <select
                        className="h-8 rounded border border-[#e5e8eb] text-[12px] font-bold px-2 mr-1 bg-white"
                        title="글자 크기"
                        onMouseDown={captureEditorSelection}
                        onFocus={captureEditorSelection}
                        value={
                            (editor?.getAttributes('textStyle').fontSize as string | undefined) ||
                            SIZE_DEFAULT
                        }
                        onChange={(e) => applyFontSize(e.target.value)}
                    >
                        <option value={SIZE_DEFAULT}>크기</option>
                        {FONT_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size.replace('px', '')}
                            </option>
                        ))}
                    </select>

                    <ToolBtn
                        title="굵게"
                        active={editor?.isActive('bold')}
                        onClick={() => withEditor((ed) => ed.chain().focus().toggleBold().run())}
                    >
                        <Bold className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="기울임"
                        active={editor?.isActive('italic')}
                        onClick={() => withEditor((ed) => ed.chain().focus().toggleItalic().run())}
                    >
                        <Italic className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="밑줄"
                        active={editor?.isActive('underline')}
                        onClick={() => withEditor((ed) => ed.chain().focus().toggleUnderline().run())}
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="취소선"
                        active={editor?.isActive('strike')}
                        onClick={() => withEditor((ed) => ed.chain().focus().toggleStrike().run())}
                    >
                        <Strikethrough className="w-4 h-4" />
                    </ToolBtn>

                    <label className="h-8 w-8 rounded inline-flex items-center justify-center hover:bg-[#f0f1f3] cursor-pointer" title="글자색" onMouseDown={keepEditorSelection}>
                        <span className="text-[12px] font-black border-b-2 border-[#ff5252]">A</span>
                        <input
                            type="color"
                            className="sr-only"
                            onChange={(e) =>
                                withEditor((ed) => ed.chain().focus().setColor(e.target.value).run())
                            }
                        />
                    </label>
                    <div className="relative">
                        <ToolBtn
                            title="형광펜"
                            active={editor?.isActive('highlight') || picker === 'highlight'}
                            onClick={() =>
                                setPicker((p) => (p === 'highlight' ? 'none' : 'highlight'))
                            }
                        >
                            <Highlighter className="w-4 h-4" />
                        </ToolBtn>
                        <HighlightColorPopover
                            open={picker === 'highlight'}
                            colors={HIGHLIGHT_COLORS}
                            onClose={() => setPicker('none')}
                            onPick={applyHighlight}
                            onClear={clearHighlight}
                        />
                    </div>

                    <span className="w-px h-5 bg-[#e5e8eb] mx-1" />

                    <ToolBtn
                        title="왼쪽"
                        active={alignActive('left')}
                        onClick={() => applyAlign('left')}
                    >
                        <AlignLeft className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="가운데"
                        active={alignActive('center')}
                        onClick={() => applyAlign('center')}
                    >
                        <AlignCenter className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="오른쪽"
                        active={alignActive('right')}
                        onClick={() => applyAlign('right')}
                    >
                        <AlignRight className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="양쪽"
                        active={alignActive('justify')}
                        onClick={() => applyAlign('justify')}
                    >
                        <AlignJustify className="w-4 h-4" />
                    </ToolBtn>

                    {editor?.isActive('table') ? (
                        <>
                            <span className="w-px h-5 bg-[#e5e8eb] mx-1" />
                            <ToolBtn
                                title="표 전체 선택"
                                active={tableNodeSelected}
                                onClick={() => withEditor((ed) => selectCurrentTable(ed))}
                            >
                                <Table2 className="w-4 h-4" />
                            </ToolBtn>
                            <ToolBtn
                                title="표 삭제"
                                onClick={() =>
                                    withEditor((ed) => ed.chain().focus().deleteTable().run())
                                }
                            >
                                <X className="w-4 h-4" />
                            </ToolBtn>
                        </>
                    ) : null}

                    <span className="w-px h-5 bg-[#e5e8eb] mx-1" />

                    <ToolBtn
                        title="글머리"
                        active={editor?.isActive('bulletList')}
                        onClick={() => withEditor((ed) => ed.chain().focus().toggleBulletList().run())}
                    >
                        <List className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="번호"
                        active={editor?.isActive('orderedList')}
                        onClick={() => withEditor((ed) => ed.chain().focus().toggleOrderedList().run())}
                    >
                        <ListOrdered className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="체크리스트"
                        active={editor?.isActive('taskList')}
                        onClick={() => withEditor((ed) => ed.chain().focus().toggleTaskList().run())}
                    >
                        <CheckSquare className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="제목"
                        active={editor?.isActive('heading', { level: 2 })}
                        onClick={() =>
                            withEditor((ed) => ed.chain().focus().toggleHeading({ level: 2 }).run())
                        }
                    >
                        <Heading2 className="w-4 h-4" />
                    </ToolBtn>

                    <span className="w-px h-5 bg-[#e5e8eb] mx-1" />

                    <ToolBtn
                        title="실행취소"
                        disabled={!editor?.can().undo()}
                        onClick={() => withEditor((ed) => ed.commands.undo())}
                    >
                        <Undo2 className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="다시실행"
                        disabled={!editor?.can().redo()}
                        onClick={() => withEditor((ed) => ed.commands.redo())}
                    >
                        <Redo2 className="w-4 h-4" />
                    </ToolBtn>
                </div>
            </header>

            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void insertImage(f)
                    e.target.value = ''
                }}
            />

            {/* 본문 + 사이드 */}
            <div className="flex-1 min-h-0 flex">
                <div className="flex-1 overflow-y-auto py-6 px-3 sm:px-6">
                    <div className="mx-auto max-w-[860px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] min-h-[calc(100vh-220px)] relative">
                        {uploading ? (
                            <div className="absolute inset-x-0 top-0 z-10 bg-[#03c75a]/90 text-white text-center text-[12px] font-bold py-1.5">
                                이미지 처리 중…
                            </div>
                        ) : null}
                        {uploadError ? (
                            <div className="absolute inset-x-0 top-0 z-10 bg-[#ff5252] text-white text-center text-[12px] font-bold py-1.5 px-3">
                                {uploadError}
                            </div>
                        ) : null}
                        {showHtml ? (
                            <textarea
                                value={htmlDraft}
                                onChange={(e) => setHtmlDraft(e.target.value)}
                                className="w-full min-h-[calc(100vh-220px)] p-6 font-mono text-[12px] outline-none resize-none"
                                spellCheck={false}
                            />
                        ) : (
                            <EditorContent editor={editor} />
                        )}
                    </div>
                </div>

                {sidebar !== 'none' ? (
                    <aside className="w-[280px] shrink-0 border-l border-[#e5e8eb] bg-white overflow-y-auto hidden md:block">
                        <div className="p-4 space-y-3">
                            <h3 className="text-[14px] font-bold">
                                {sidebar === 'library'
                                    ? '라이브러리'
                                    : sidebar === 'blocks'
                                      ? '블록 삽입'
                                      : '템플릿'}
                            </h3>
                            {sidebar === 'library' ? (
                                <div className="space-y-2">
                                    <p className="text-[12px] text-[#868b94] leading-relaxed">
                                        사진을 삽입하려면 상단 「사진」을 사용하세요. 상품에 저장된
                                        상세 이미지는 상품 저장 후 상세이미지 슬롯에서도 관리할 수
                                        있습니다.
                                    </p>
                                    <button
                                        type="button"
                                        className="w-full h-10 rounded-md border border-dashed border-[#c9cdd2] text-[13px] font-bold text-[#555] hover:border-[#03c75a] hover:text-[#03c75a]"
                                        onMouseDown={keepEditorSelection}
                                        onClick={() => {
                                            exitHtmlMode()
                                            fileRef.current?.click()
                                        }}
                                    >
                                        + 사진 추가
                                    </button>
                                </div>
                            ) : sidebar === 'blocks' ? (
                                <div className="space-y-2">
                                    <p className="text-[12px] text-[#868b94] leading-relaxed">
                                        자주 쓰는 상세 구성 블록을 커서 위치에 삽입합니다.
                                    </p>
                                    {CONTENT_BLOCKS.map((block) => (
                                        <button
                                            key={block.id}
                                            type="button"
                                            className="w-full text-left rounded-md border border-[#e5e8eb] px-3 py-3 hover:border-[#03c75a] hover:bg-[#f3fff7]"
                                            onMouseDown={keepEditorSelection}
                                            onClick={() => insertContentBlock(block.html)}
                                        >
                                            <div className="text-[13px] font-bold">{block.label}</div>
                                            <div className="text-[11px] text-[#868b94] mt-0.5">
                                                클릭하여 삽입
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {[
                                        {
                                            id: 'intro',
                                            label: '소개형',
                                            html: '<h2 style="text-align:center">상품 소개</h2><p style="text-align:center">핵심 장점을 입력하세요.</p><hr><p></p>',
                                        },
                                        {
                                            id: 'spec',
                                            label: '스펙형',
                                            html: '<h2>제품 사양</h2><ul><li>소재: </li><li>사이즈: </li><li>공정: </li></ul><p></p>',
                                        },
                                        {
                                            id: 'howto',
                                            label: '이용안내형',
                                            html: '<h2>주문 안내</h2><ol><li>옵션을 선택합니다.</li><li>견적/문의로 진행합니다.</li><li>제작·배송을 안내드립니다.</li></ol><p></p>',
                                        },
                                    ].map((tpl) => (
                                        <button
                                            key={tpl.id}
                                            type="button"
                                            className="w-full text-left rounded-md border border-[#e5e8eb] px-3 py-3 hover:border-[#03c75a] hover:bg-[#f3fff7]"
                                            onMouseDown={keepEditorSelection}
                                            onClick={() => {
                                                withEditor((ed) => {
                                                    ed.commands.setContent(tpl.html)
                                                })
                                                setSidebar('none')
                                            }}
                                        >
                                            <div className="text-[13px] font-bold">{tpl.label}</div>
                                            <div className="text-[11px] text-[#868b94] mt-0.5">
                                                클릭하여 적용
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                ) : null}
            </div>

            {/* 하단 퀵바 + 완료 */}
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-[101]">
                <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#2b2d31]/90 px-2 py-1.5 shadow-lg">
                    <button
                        type="button"
                        className="h-9 w-9 rounded-full text-white/90 hover:bg-white/10 inline-flex items-center justify-center"
                        title="사진"
                        onMouseDown={keepEditorSelection}
                        onClick={() => {
                            exitHtmlMode()
                            fileRef.current?.click()
                        }}
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="h-9 w-9 rounded-full text-white/90 hover:bg-white/10 inline-flex items-center justify-center"
                        title="구분선"
                        onMouseDown={keepEditorSelection}
                        onClick={() =>
                            withEditor((ed) => ed.chain().focus().setHorizontalRule().run())
                        }
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="h-9 w-9 rounded-full text-white/90 hover:bg-white/10 inline-flex items-center justify-center"
                        title="인용"
                        onMouseDown={keepEditorSelection}
                        onClick={() =>
                            withEditor((ed) => ed.chain().focus().toggleBlockquote().run())
                        }
                    >
                        <Quote className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="h-9 w-9 rounded-full text-white/90 hover:bg-white/10 inline-flex items-center justify-center"
                        title="링크"
                        onMouseDown={keepEditorSelection}
                        onClick={setLink}
                    >
                        <Link2 className="w-4 h-4" />
                    </button>
                    <span className="w-px h-5 bg-white/20 mx-0.5" />
                    <button
                        type="button"
                        onClick={() => void handleRegister()}
                        disabled={registering}
                        className="h-9 px-4 rounded-full bg-[#03c75a] text-white text-[13px] font-black inline-flex items-center gap-1 hover:bg-[#02b351] disabled:opacity-60"
                        title="상세 내용을 반영하고 닫기"
                    >
                        <Check className="w-4 h-4" />
                        {registering ? '반영 중…' : '완료'}
                    </button>
                </div>
            </div>

            <style>{`
                .detail-smart-editor p.is-editor-empty:first-child::before {
                    color: #adb0b5;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .detail-smart-editor p {
                    font-size: 15px;
                    font-weight: 400;
                    line-height: 1.7;
                    margin: 0 0 0.75em;
                }
                .detail-smart-editor h1 {
                    font-size: 28px;
                    font-weight: 800;
                    line-height: 1.3;
                    margin: 0.6em 0 0.4em;
                }
                .detail-smart-editor h2 {
                    font-size: 22px;
                    font-weight: 800;
                    line-height: 1.35;
                    margin: 0.55em 0 0.35em;
                }
                .detail-smart-editor h3 {
                    font-size: 18px;
                    font-weight: 700;
                    line-height: 1.4;
                    margin: 0.5em 0 0.3em;
                }
                /* Tailwind preflight가 list-style을 제거하므로 명시 복원 */
                .detail-smart-editor ul {
                    list-style-type: disc;
                    padding-left: 1.5em;
                    margin: 0.5em 0 0.75em;
                }
                .detail-smart-editor ol {
                    list-style-type: decimal;
                    padding-left: 1.5em;
                    margin: 0.5em 0 0.75em;
                }
                .detail-smart-editor li {
                    margin: 0.2em 0;
                }
                .detail-smart-editor li p {
                    margin: 0;
                }
                .detail-smart-editor img,
                .detail-smart-editor .detail-editor-img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                    margin: 12px 0;
                    display: block;
                }
                .detail-smart-editor table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 12px 0;
                    cursor: pointer;
                }
                .detail-smart-editor table[data-align='center'] {
                    width: auto;
                    max-width: 100%;
                    margin-left: auto;
                    margin-right: auto;
                }
                .detail-smart-editor table[data-align='right'] {
                    width: auto;
                    max-width: 100%;
                    margin-left: auto;
                    margin-right: 0;
                }
                .detail-smart-editor table.ProseMirror-selectednode {
                    outline: 2px solid #03c75a;
                    outline-offset: 3px;
                }
                .detail-smart-editor th,
                .detail-smart-editor td {
                    border: 1px solid #e5e8eb;
                    padding: 8px 10px;
                    vertical-align: middle;
                }
                .detail-smart-editor blockquote {
                    border-left: 3px solid #03c75a;
                    padding-left: 12px;
                    color: #555;
                    margin: 12px 0;
                }
                .detail-smart-editor hr {
                    border: none;
                    border-top: 1px solid #e5e8eb;
                    margin: 20px 0;
                }
                .detail-smart-editor span[style*='font-size'],
                .detail-smart-editor span[style*='font-family'] {
                    line-height: 1.5;
                }
                .detail-smart-editor ul[data-type='taskList'] {
                    list-style: none;
                    padding-left: 0;
                    margin: 0.5em 0 0.75em;
                }
                .detail-smart-editor ul[data-type='taskList'] li {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                .detail-smart-editor ul[data-type='taskList'] li > label {
                    flex: 0 0 auto;
                    margin-top: 0.2em;
                }
                .detail-smart-editor ul[data-type='taskList'] li > div {
                    flex: 1 1 auto;
                }
                .detail-smart-editor .detail-callout {
                    border-radius: 8px;
                    padding: 12px 14px;
                    margin: 12px 0;
                    border-left: 4px solid #03c75a;
                    background: #f3faf6;
                }
                .detail-smart-editor .detail-callout-warn {
                    border-left-color: #f59e0b;
                    background: #fff8eb;
                }
                .detail-smart-editor .detail-callout-info {
                    border-left-color: #0ea5e9;
                    background: #eff9ff;
                }
                .detail-smart-editor .detail-badge {
                    display: inline-block;
                    padding: 2px 10px;
                    margin: 0 4px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 800;
                    background: #eef0f2;
                    color: #333;
                }
                .detail-smart-editor .detail-badge-teal {
                    background: #e0f7f4;
                    color: #0f766e;
                }
                .detail-smart-editor .detail-badge-pink {
                    background: #fce7f3;
                    color: #be185d;
                }
                .detail-smart-editor .detail-cta {
                    display: inline-block;
                    padding: 10px 20px;
                    border-radius: 999px;
                    background: #03c75a;
                    color: #fff !important;
                    font-weight: 800;
                    text-decoration: none !important;
                }
                .detail-smart-editor .detail-youtube {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    margin: 16px 0;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #111;
                }
                .detail-smart-editor .detail-youtube iframe {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    border: 0;
                }
            `}</style>
        </div>
    )
}
