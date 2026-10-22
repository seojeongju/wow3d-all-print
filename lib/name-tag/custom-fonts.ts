'use client'

import { parse } from 'opentype.js'
import { useSyncExternalStore } from 'react'

export type CustomFontSource = 'local' | 'file'

export type CustomFontItem = {
    id: string
    name: string
    cssFamily: string
    buffer: ArrayBuffer
    source: CustomFontSource
}

export type LocalSystemFontInfo = {
    family: string
    fullName: string
    postscriptName: string
    style: string
}

declare global {
    interface Window {
        queryLocalFonts?: (options?: { postscriptNames?: string[] }) => Promise<
            Array<{
                family: string
                fullName: string
                postscriptName: string
                style: string
                blob: () => Promise<Blob>
            }>
        >
    }
}

const customFontMap = new Map<string, CustomFontItem>()
const listeners = new Set<() => void>()

function notifyListeners() {
    for (const listener of listeners) {
        listener()
    }
}

export function isLocalFontAccessSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.queryLocalFonts === 'function'
}

/** Local Font Access API를 통해 PC에 설치된 폰트 목록을 가져옵니다. */
export async function queryLocalFontsSafe(): Promise<
    Array<{
        family: string
        fullName: string
        postscriptName: string
        style: string
        blob: () => Promise<Blob>
    }>
> {
    if (!isLocalFontAccessSupported() || !window.queryLocalFonts) {
        throw new Error('Local Font Access API is not supported in this browser.')
    }
    return await window.queryLocalFonts()
}

/** opentype 메타데이터에서 읽기 쉬운 폰트 이름을 추출합니다. */
function extractFontName(font: ReturnType<typeof parse>, fallback: string): string {
    const names = font.names
    if (!names) return fallback

    const tryName = (record?: Record<string, string>) => {
        if (!record) return null
        return (
            record.ko ||
            record['ko-KR'] ||
            record.en ||
            record['en-US'] ||
            Object.values(record)[0] ||
            null
        )
    }

    return tryName(names.fontFamily) || tryName(names.fullName) || fallback
}

let fontSeq = 0

/**
 * 폰트 바이너리(ArrayBuffer)를 검증하고 등록합니다.
 * 2D 미리보기를 위해 브라우저 FontFace로 등록하고, 3D 워커 전달을 위해 버퍼를 보관합니다.
 */
export async function registerCustomFont(
    buffer: ArrayBuffer,
    options?: { nameFallback?: string; source?: CustomFontSource }
): Promise<CustomFontItem> {
    // 1. opentype.js로 유효한 TTF/OTF인지 검증
    let parsedFont: ReturnType<typeof parse>
    try {
        parsedFont = parse(buffer)
    } catch {
        throw new Error('지원되지 않거나 손상된 폰트 파일 형식입니다. (TTF 또는 OTF 파일 필요)')
    }

    const fallback = options?.nameFallback || `내 글꼴 ${++fontSeq}`
    const fontName = extractFontName(parsedFont, fallback)
    const sanitizedId = fontName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)
    const id = `custom:${Date.now()}-${sanitizedId || 'font'}`
    const cssFamily = `WowCustomFont_${Date.now()}_${fontSeq}`

    // 2. 브라우저 FontFace 등록
    if (typeof window !== 'undefined' && 'FontFace' in window) {
        try {
            const fontFace = new FontFace(cssFamily, buffer)
            const loadedFace = await fontFace.load()
            document.fonts.add(loadedFace)
        } catch (fontErr) {
            console.warn('[name-tag] FontFace 등록 실패 (텍스트 렌더링에 시스템 폴백 사용):', fontErr)
        }
    }

    const item: CustomFontItem = {
        id,
        name: fontName,
        cssFamily,
        buffer,
        source: options?.source || 'file',
    }

    customFontMap.set(id, item)
    notifyListeners()
    return item
}

/** 파일 객체로부터 폰트를 읽어 등록합니다. */
export async function registerCustomFontFromFile(file: File): Promise<CustomFontItem> {
    const buffer = await file.arrayBuffer()
    const nameFallback = file.name.replace(/\.[^.]+$/, '')
    return await registerCustomFont(buffer, { nameFallback, source: 'file' })
}

/** Local Font Access API의 FontData 객체로부터 폰트를 읽어 등록합니다. */
export async function registerLocalFontData(fontData: {
    fullName: string
    family: string
    blob: () => Promise<Blob>
}): Promise<CustomFontItem> {
    const blob = await fontData.blob()
    const buffer = await blob.arrayBuffer()
    const nameFallback = fontData.fullName || fontData.family
    return await registerCustomFont(buffer, { nameFallback, source: 'local' })
}

export function getCustomFont(id: string): CustomFontItem | undefined {
    return customFontMap.get(id)
}

export function getCustomFontBuffer(id: string): ArrayBuffer | undefined {
    return customFontMap.get(id)?.buffer
}

export function removeCustomFont(id: string): void {
    if (customFontMap.delete(id)) {
        notifyListeners()
    }
}

export function getAllCustomFonts(): CustomFontItem[] {
    return Array.from(customFontMap.values())
}

let cachedCustomFonts: CustomFontItem[] = []
function getCustomFontsSnapshot(): CustomFontItem[] {
    const next = getAllCustomFonts()
    if (
        next.length === cachedCustomFonts.length &&
        next.every((item, i) => item.id === cachedCustomFonts[i]?.id)
    ) {
        return cachedCustomFonts
    }
    cachedCustomFonts = next
    return cachedCustomFonts
}

export function useCustomFonts(): CustomFontItem[] {
    return useSyncExternalStore(
        (cb) => {
            listeners.add(cb)
            return () => {
                listeners.delete(cb)
            }
        },
        getCustomFontsSnapshot,
        () => []
    )
}
