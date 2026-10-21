'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { NameTagBuildResult } from '@/lib/name-tag/build'
import type { NameTagDesign } from '@/lib/name-tag/design'
import type { NameTagWorkerRequest, NameTagWorkerResponse } from '@/lib/name-tag/worker'

type Pending = (response: NameTagWorkerResponse) => void

/** 디자인이 바뀌면 Worker에서 형상을 다시 만든다. 늦게 도착한 이전 결과는 버린다. */
export function useNameTagBuilder(design: NameTagDesign, debounceMs = 160) {
    const workerRef = useRef<Worker | null>(null)
    const pendingRef = useRef(new Map<number, Pending>())
    const seqRef = useRef(0)
    const latestBuildRef = useRef(0)
    const [result, setResult] = useState<NameTagBuildResult | null>(null)
    const [building, setBuilding] = useState(false)
    const [error, setError] = useState('')
    const [buildMs, setBuildMs] = useState(0)

    useEffect(() => {
        const worker = new Worker(new URL('./worker.ts', import.meta.url))
        workerRef.current = worker
        const pending = pendingRef.current
        worker.onmessage = (event: MessageEvent<NameTagWorkerResponse>) => {
            const handler = pending.get(event.data.id)
            pending.delete(event.data.id)
            handler?.(event.data)
        }
        worker.onerror = (event) => {
            console.error('[name-tag] Worker 오류', event.message)
            setError(event.message || 'worker error')
            setBuilding(false)
        }
        return () => {
            worker.terminate()
            workerRef.current = null
            pending.clear()
        }
    }, [])

    const send = useCallback((request: Omit<NameTagWorkerRequest, 'id'>, handler: Pending) => {
        const worker = workerRef.current
        if (!worker) return
        const id = ++seqRef.current
        pendingRef.current.set(id, handler)
        worker.postMessage({ ...request, id } as NameTagWorkerRequest)
        return id
    }, [])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setBuilding(true)
            const id = send({ type: 'build', design }, (response) => {
                if (response.id !== latestBuildRef.current) return
                setBuilding(false)
                if (response.type === 'error') {
                    setError(response.message)
                    return
                }
                if (response.type === 'build') {
                    setError('')
                    setResult(response.result)
                    setBuildMs(response.ms)
                }
            })
            if (id) latestBuildRef.current = id
        }, debounceMs)
        return () => window.clearTimeout(timer)
    }, [debounceMs, design, send])

    const requestStl = useCallback(
        (target: NameTagDesign) =>
            new Promise<ArrayBuffer | null>((resolve, reject) => {
                const id = send({ type: 'stl', design: target }, (response) => {
                    if (response.type === 'stl') resolve(response.stl)
                    else if (response.type === 'error') reject(new Error(response.message))
                    else resolve(null)
                })
                if (!id) resolve(null)
            }),
        [send]
    )

    return { result, building, error, buildMs, requestStl }
}
