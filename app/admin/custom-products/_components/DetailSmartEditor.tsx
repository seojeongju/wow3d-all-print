'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
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
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    Check,
    Code2,
    Heading2,
    Highlighter,
    Image as ImageIcon,
    Italic,
    Link2,
    List,
    ListOrdered,
    Minus,
    Plus,
    Quote,
    Redo2,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
    X,
    Type,
    Library,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { detailBodyToEditorHtml, sanitizeDetailHtml } from '@/lib/sanitize-html'

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
            onClick={onClick}
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
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-[#f0f1f3] text-[#333] min-w-[52px]"
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
    const [saveCount, setSaveCount] = useState(0)
    const [showHtml, setShowHtml] = useState(false)
    const [htmlDraft, setHtmlDraft] = useState('')
    const [uploading, setUploading] = useState(false)
    const [sidebar, setSidebar] = useState<'none' | 'library' | 'template'>('none')
    const [registering, setRegistering] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
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
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
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
        if (!editor || editor.isDestroyed) return
        // clearNodes로 목록·제목·인용 등 블록을 정리한 뒤 목표 단락/제목으로 설정
        // (toggleHeading은 이미 제목일 때 다시 누르면 해제되어 셀렉트와 맞지 않음)
        if (v === 'p') {
            editor.chain().focus().clearNodes().setParagraph().run()
            return
        }
        const level = v === 'h1' ? 1 : v === 'h2' ? 2 : 3
        editor.chain().focus().clearNodes().setHeading({ level }).run()
    }

    const applyFontFamily = (v: string) => {
        if (!editor || editor.isDestroyed) return
        if (v === FONT_DEFAULT || !v) {
            editor.chain().focus().extendMarkRange('textStyle').unsetFontFamily().run()
            return
        }
        editor.chain().focus().setFontFamily(v).run()
    }

    const applyFontSize = (v: string) => {
        if (!editor || editor.isDestroyed) return
        if (v === SIZE_DEFAULT || !v) {
            editor.chain().focus().extendMarkRange('textStyle').unsetFontSize().run()
            return
        }
        editor.chain().focus().setFontSize(v).run()
    }

    const setLink = () => {
        if (!editor) return
        const prev = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('링크 URL', prev || 'https://')
        if (url === null) return
        if (!url.trim()) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
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
                <div className="px-3 py-1.5 flex items-center justify-between gap-2 border-t border-[#f0f1f3] overflow-x-auto">
                    <div className="flex items-center gap-0.5">
                        <InsertBtn
                            icon={ImageIcon}
                            label="사진"
                            onClick={() => fileRef.current?.click()}
                        />
                        <InsertBtn
                            icon={Quote}
                            label="인용구"
                            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        />
                        <InsertBtn
                            icon={Minus}
                            label="구분선"
                            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        />
                        <InsertBtn icon={Link2} label="링크" onClick={setLink} />
                        <InsertBtn
                            icon={Type}
                            label="표"
                            onClick={() =>
                                editor
                                    ?.chain()
                                    .focus()
                                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                                    .run()
                            }
                        />
                        <InsertBtn
                            icon={Code2}
                            label="HTML"
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
                            onClick={() => editor?.chain().focus().insertContent('<p></p>').run()}
                        />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
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
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                    >
                        <Bold className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="기울임"
                        active={editor?.isActive('italic')}
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="밑줄"
                        active={editor?.isActive('underline')}
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="취소선"
                        active={editor?.isActive('strike')}
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                    >
                        <Strikethrough className="w-4 h-4" />
                    </ToolBtn>

                    <label className="h-8 w-8 rounded inline-flex items-center justify-center hover:bg-[#f0f1f3] cursor-pointer" title="글자색">
                        <span className="text-[12px] font-black border-b-2 border-[#ff5252]">A</span>
                        <input
                            type="color"
                            className="sr-only"
                            onChange={(e) =>
                                editor?.chain().focus().setColor(e.target.value).run()
                            }
                        />
                    </label>
                    <ToolBtn
                        title="형광펜"
                        active={editor?.isActive('highlight')}
                        onClick={() =>
                            editor?.chain().focus().toggleHighlight({ color: '#fff59d' }).run()
                        }
                    >
                        <Highlighter className="w-4 h-4" />
                    </ToolBtn>

                    <span className="w-px h-5 bg-[#e5e8eb] mx-1" />

                    <ToolBtn
                        title="왼쪽"
                        active={editor?.isActive({ textAlign: 'left' })}
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                    >
                        <AlignLeft className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="가운데"
                        active={editor?.isActive({ textAlign: 'center' })}
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                    >
                        <AlignCenter className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="오른쪽"
                        active={editor?.isActive({ textAlign: 'right' })}
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                    >
                        <AlignRight className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="양쪽"
                        active={editor?.isActive({ textAlign: 'justify' })}
                        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                    >
                        <AlignJustify className="w-4 h-4" />
                    </ToolBtn>

                    <span className="w-px h-5 bg-[#e5e8eb] mx-1" />

                    <ToolBtn
                        title="글머리"
                        active={editor?.isActive('bulletList')}
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    >
                        <List className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="번호"
                        active={editor?.isActive('orderedList')}
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        title="제목"
                        active={editor?.isActive('heading', { level: 2 })}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        <Heading2 className="w-4 h-4" />
                    </ToolBtn>

                    <span className="w-px h-5 bg-[#e5e8eb] mx-1" />

                    <ToolBtn title="실행취소" onClick={() => editor?.chain().focus().undo().run()}>
                        <Undo2 className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn title="다시실행" onClick={() => editor?.chain().focus().redo().run()}>
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
                                {sidebar === 'library' ? '라이브러리' : '템플릿'}
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
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        + 사진 추가
                                    </button>
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
                                            onClick={() => {
                                                editor?.commands.setContent(tpl.html)
                                                setShowHtml(false)
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
                        onClick={() => fileRef.current?.click()}
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="h-9 w-9 rounded-full text-white/90 hover:bg-white/10 inline-flex items-center justify-center"
                        title="구분선"
                        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="h-9 w-9 rounded-full text-white/90 hover:bg-white/10 inline-flex items-center justify-center"
                        title="인용"
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    >
                        <Quote className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="h-9 w-9 rounded-full text-white/90 hover:bg-white/10 inline-flex items-center justify-center"
                        title="링크"
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
                }
                .detail-smart-editor th,
                .detail-smart-editor td {
                    border: 1px solid #e5e8eb;
                    padding: 8px 10px;
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
            `}</style>
        </div>
    )
}
