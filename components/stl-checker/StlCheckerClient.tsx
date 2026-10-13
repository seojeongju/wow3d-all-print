'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Download,
    Eye,
    EyeOff,
    Info,
    Loader2,
    Lock,
    LogIn,
    RotateCcw,
    ScanSearch,
    Upload,
    Wrench,
    XCircle,
    type LucideIcon,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Scene from '@/components/canvas/Scene'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useFileStore } from '@/store/useFileStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useAnalysisProgressStore } from '@/store/useAnalysisProgressStore'
import { useCpuModelAnalysis } from '@/hooks/useCpuModelAnalysis'
import { getParsedModelGeometry } from '@/lib/model-parse-cache'
import { MESH_ORIENT_USERDATA_KEY } from '@/lib/mesh-orient'
import { meshVolumeCm3, type GeometryAnalysis } from '@/lib/geometry'
import {
    MODEL_FILE_ACCEPT_STRING,
    getModelFileFromDataTransfer,
    hasModelFileExtension,
    isModelFileTooLarge,
} from '@/lib/model-file'
import {
    inspectMesh,
    meshVerdict,
    type MeshHighlights,
    type MeshInspection,
    type MeshInspectOutcome,
    type MeshVerdict,
} from '@/lib/mesh-inspect'
import { meshRepairChanged, repairedFileName } from '@/lib/mesh-repair'
import { runMeshRepair } from '@/lib/mesh-repair-client'
import { savePendingRepair, takePendingRepair, type PendingRepair } from '@/lib/stl-repair-pending'
import { fitsBuildVolume, formatBuildDims } from '@/lib/build-volume'
import { ESTIMATOR_METHODS, type EstimatorSpecs } from '@/lib/price-estimator'
import { CHECKER_CONVERSION_EVENTS, CONVERSION_EVENT_CATEGORY } from '@/lib/conversion-events'
import { trackConversionEvent, trackConversionEventOnce } from '@/lib/track-conversion-event'

type CheckStatus = 'good' | 'warn' | 'fix' | 'info'

type InspectState = {
    file: File
    outcome: MeshInspectOutcome | null
    failed: boolean
    autoOriented: number
    /** 메쉬 부호 부피 (cm³) — 리페어 전·후 비교용 */
    volume: number | null
}

/** 최장 변이 이보다 작으면 단위(cm·m·inch) 오류 가능성 */
const TINY_MODEL_MM = 5
const SAMPLE_PATH = '/test_cube.stl'
/** 견적 페이지가 샘플 파일명은 진입 시 비우므로 샘플은 핸드오프하지 않음 */
const SAMPLE_NAME = 'test_cube.stl'
/** 자동 리페어 체험용 — 구멍·틈·중복 면·뒤집힌 면·부스러기를 일부러 넣은 합성 원기둥 */
const BROKEN_SAMPLE_PATH = '/broken_sample.stl'
const BROKEN_SAMPLE_NAME = 'broken_sample.stl'

const STATUS_STYLE: Record<CheckStatus, { icon: LucideIcon; className: string }> = {
    good: { icon: CheckCircle2, className: 'text-emerald-400' },
    warn: { icon: AlertTriangle, className: 'text-amber-400' },
    fix: { icon: XCircle, className: 'text-rose-400' },
    info: { icon: Info, className: 'text-sky-300' },
}

const VERDICT_STYLE: Record<MeshVerdict, string> = {
    good: 'border-emerald-400/30 bg-emerald-500/10',
    warn: 'border-amber-400/30 bg-amber-500/10',
    fix: 'border-rose-400/30 bg-rose-500/10',
}

const ISSUE_LEGEND = [
    { key: 'holes', field: 'openEdges', color: 'bg-rose-500' },
    { key: 'nonManifold', field: 'nonManifoldEdges', color: 'bg-amber-500' },
    { key: 'flipped', field: 'flippedEdges', color: 'bg-purple-500' },
] as const

function isRepairable(m: MeshInspection): boolean {
    return (
        m.openEdges > 0 ||
        m.nonManifoldEdges > 0 ||
        m.flippedEdges > 0 ||
        m.invertedShells > 0 ||
        m.degenerateTriangles > 0 ||
        m.shells > 1
    )
}

export default function StlCheckerClient() {
    useCpuModelAnalysis()
    const t = useTranslations('StlChecker')
    const router = useRouter()
    const userId = useAuthStore((s) => s.user?.id ?? null)
    const file = useFileStore((s) => s.file)
    const analysis = useFileStore((s) => s.baseAnalysis)
    const analysisError = useFileStore((s) => s.analysisError)
    const setFile = useFileStore((s) => s.setFile)
    const reset = useFileStore((s) => s.reset)
    const stage = useAnalysisProgressStore((s) => (s.file === file ? s.stage : null))

    const [inspect, setInspect] = useState<InspectState | null>(null)
    const [specs, setSpecs] = useState<EstimatorSpecs | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [dragging, setDragging] = useState(false)
    const [loadingSample, setLoadingSample] = useState<string | null>(null)
    const [repair, setRepair] = useState<PendingRepair | null>(null)
    const [repairing, setRepairing] = useState(false)
    const [repairMessage, setRepairMessage] = useState<string | null>(null)
    const [removeFragments, setRemoveFragments] = useState(true)
    const [showIssues, setShowIssues] = useState(true)
    const [restored, setRestored] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const trackedResultFor = useRef<File | null>(null)
    /** 리페어 전·후를 오갈 때 다시 계산하지 않도록 파일별 점검·분석 결과 보관 */
    const inspectCache = useRef(new WeakMap<File, InspectState>())
    const analysisCache = useRef(new WeakMap<File, GeometryAnalysis>())
    const restoreStarted = useRef(false)

    useEffect(() => {
        trackConversionEventOnce('wow3d-checker-view', {
            eventName: CHECKER_CONVERSION_EVENTS.VIEW,
            category: CONVERSION_EVENT_CATEGORY.CHECKER,
            userId,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 진입 시 1회만
    }, [])

    useEffect(() => {
        fetch('/api/print-specs', { cache: 'no-store' })
            .then((r) => r.json())
            .then((j) => setSpecs(j?.data ?? null))
            .catch(() => { })
    }, [])

    // 로그인하러 가기 전에 보관한 리페어 결과 복원 (이메일 로그인은 화면 이동만 하므로 같은 파일이 남아 있을 수 있음)
    useEffect(() => {
        if (restoreStarted.current) return
        restoreStarted.current = true
        void takePendingRepair().then((pending) => {
            if (!pending) return
            const current = useFileStore.getState().file
            const sameAs = (f: File) => current != null && current.name === f.name && current.size === f.size
            if (current && !sameAs(pending.repaired) && !sameAs(pending.original)) return
            setRepair(pending)
            setRestored(true)
            setFile(pending.repaired)
        })
    }, [setFile])

    // 뷰어·치수 분석과 같은 파싱 결과를 재사용해 메쉬 무결성 점검
    useEffect(() => {
        if (!file) return
        const cached = inspectCache.current.get(file)
        if (cached) {
            setInspect(cached)
            return
        }
        let cancelled = false
        getParsedModelGeometry(file)
            .then(async (geo) => {
                const outcome = geo ? await inspectMesh(geo, () => cancelled, { highlights: true }) : null
                const autoOriented = Number(geo?.userData[MESH_ORIENT_USERDATA_KEY]) || 0
                if (cancelled) return
                const volume = geo ? meshVolumeCm3(geo) : null
                const next = { file, outcome, failed: outcome == null, autoOriented, volume }
                inspectCache.current.set(file, next)
                setInspect(next)
            })
            .catch(() => {
                if (!cancelled) setInspect({ file, outcome: null, failed: true, autoOriented: 0, volume: null })
            })
        return () => {
            cancelled = true
        }
    }, [file])

    // bbox 근사·중간값이 아닌 정밀 분석(배치 후보 포함)만 보관
    useEffect(() => {
        if (file && analysis?.orientations) analysisCache.current.set(file, analysis)
    }, [file, analysis])

    const isSample = file?.name === SAMPLE_NAME
    const viewingRepaired = repair != null && file === repair.repaired
    const current = inspect && inspect.file === file ? inspect : null
    const mesh = current?.outcome?.status === 'ok' ? current.outcome.result : null
    const highlights: MeshHighlights | null =
        current?.outcome?.status === 'ok' ? current.outcome.highlights ?? null : null
    const meshDone = current != null
    const autoOriented = current?.autoOriented ?? 0
    const busy = Boolean(file) && (!meshDone || (!analysis && !analysisError))

    const box = analysis?.boundingBox ?? null
    const longest = box ? Math.max(box.x, box.y, box.z) : 0
    const tiny = box != null && longest < TINY_MODEL_MM
    const fitByMethod = ESTIMATOR_METHODS.map((m) => ({
        method: m,
        max: specs?.[m]?.max,
        fits: box ? fitsBuildVolume(box, specs?.[m]?.max) : true,
    }))
    const fitsAny = !specs || fitByMethod.some((f) => f.fits)

    const baseVerdict: MeshVerdict | null = mesh ? meshVerdict(mesh) : null
    const verdict: MeshVerdict | null =
        baseVerdict === 'good' && box && (tiny || !fitsAny) ? 'warn' : baseVerdict

    useEffect(() => {
        if (!file || busy || trackedResultFor.current === file || viewingRepaired) return
        trackedResultFor.current = file
        trackConversionEvent({
            eventName: CHECKER_CONVERSION_EVENTS.RESULT,
            category: CONVERSION_EVENT_CATEGORY.CHECKER,
            userId,
            metadata: {
                verdict: verdict ?? (current?.outcome?.status === 'too_large' ? 'too_large' : 'unknown'),
                triangles: mesh?.triangles ?? 0,
                holes: mesh?.holes ?? 0,
                nonManifold: mesh?.nonManifoldEdges ?? 0,
                flipped: mesh?.flippedEdges ?? 0,
                autoOriented,
                size: box ? formatBuildDims(box) : '',
            },
        })
    }, [file, busy, verdict, current, mesh, box, userId, autoOriented, viewingRepaired])

    const clearRepair = () => {
        setRepair(null)
        setRepairMessage(null)
        setRestored(false)
    }

    const acceptFile = useCallback(
        (f: File | null | undefined) => {
            if (!f) return
            if (!hasModelFileExtension(f)) {
                setNotice(t('invalidType'))
                return
            }
            if (isModelFileTooLarge(f)) {
                setNotice(t('tooLarge'))
                return
            }
            setNotice(null)
            setRepair(null)
            setRepairMessage(null)
            setRestored(false)
            setFile(f)
            trackConversionEvent({
                eventName: CHECKER_CONVERSION_EVENTS.UPLOAD,
                category: CONVERSION_EVENT_CATEGORY.CHECKER,
                userId,
                metadata: { ext: f.name.split('.').pop()?.toLowerCase() ?? '', sizeKb: Math.round(f.size / 1024) },
            })
        },
        [setFile, t, userId]
    )

    const loadSample = async (path: string, name: string) => {
        setLoadingSample(name)
        try {
            const res = await fetch(path)
            if (!res.ok) throw new Error('sample')
            const blob = await res.blob()
            acceptFile(new File([blob], name, { type: 'model/stl' }))
        } catch {
            setNotice(t('sampleFail'))
        } finally {
            setLoadingSample(null)
        }
    }

    /** 원본 ↔ 리페어 파일 전환 — 해석·분석 결과를 재사용 */
    const switchTo = (target: File) => {
        if (target === useFileStore.getState().file) return
        setFile(target, undefined, { keepParseCache: true })
        const cached = analysisCache.current.get(target)
        if (cached) {
            useFileStore.getState().setAnalysis(cached)
            useFileStore.getState().applyAutoPlacement()
        }
    }

    const runRepair = async () => {
        if (!file || !mesh || repairing) return
        setRepairing(true)
        setRepairMessage(null)
        trackConversionEvent({
            eventName: CHECKER_CONVERSION_EVENTS.REPAIR,
            category: CONVERSION_EVENT_CATEGORY.CHECKER,
            userId,
            metadata: {
                holes: mesh.holes,
                nonManifold: mesh.nonManifoldEdges,
                triangles: mesh.triangles,
                sample: file.name === BROKEN_SAMPLE_NAME,
            },
        })
        try {
            const geo = await getParsedModelGeometry(file)
            if (!geo) throw new Error('parse')
            const result = await runMeshRepair(geo, { removeFragments })
            if (result.status === 'too_large') {
                setRepairMessage(t('repair.tooLarge', { count: result.triangles.toLocaleString() }))
                return
            }
            if (result.status !== 'ok') {
                setRepairMessage(t('repair.failed'))
                return
            }
            // 해석 직후 자동으로 바로잡은 면도 리페어 파일에는 반영되어 있으므로 함께 집계
            const report = { ...result.report, flippedFixed: result.report.flippedFixed + autoOriented }
            if (!meshRepairChanged(report)) {
                setRepairMessage(t('repair.nothing'))
                return
            }
            const repaired = new File([result.stl], repairedFileName(file.name), { type: 'model/stl' })
            setRepair({ original: file, repaired, report, before: mesh, beforeVolume: current?.volume ?? null })
            setShowIssues(true)
            switchTo(repaired)
        } catch {
            setRepairMessage(t('repair.failed'))
        } finally {
            setRepairing(false)
        }
    }

    const downloadRepaired = async () => {
        if (!repair) return
        if (!userId) {
            trackConversionEvent({
                eventName: CHECKER_CONVERSION_EVENTS.REPAIR_LOGIN,
                category: CONVERSION_EVENT_CATEGORY.CHECKER,
            })
            await savePendingRepair(repair)
            router.push(`/auth?return=${encodeURIComponent('/stl-checker')}`)
            return
        }
        trackConversionEvent({
            eventName: CHECKER_CONVERSION_EVENTS.REPAIR_DOWNLOAD,
            category: CONVERSION_EVENT_CATEGORY.CHECKER,
            userId,
            metadata: { triangles: repair.report.trianglesAfter },
        })
        const url = URL.createObjectURL(repair.repaired)
        const a = document.createElement('a')
        a.href = url
        a.download = repair.repaired.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
    }

    const goQuote = () => {
        if (repair) switchTo(repair.repaired)
        trackConversionEvent({
            eventName: CHECKER_CONVERSION_EVENTS.CTA_QUOTE,
            category: CONVERSION_EVENT_CATEGORY.CHECKER,
            userId,
            metadata: { verdict: verdict ?? 'unknown', sample: isSample, repaired: repair != null },
        })
        router.push(
            isSample && !repair
                ? '/quote?entry=file&guide_source=stl_checker'
                : '/quote?entry=file&handoff=1&guide_source=stl_checker'
        )
    }

    const checkAnother = () => {
        reset()
        setInspect(null)
        setNotice(null)
        clearRepair()
    }

    const formatNum = (n: number) => n.toLocaleString()

    const checks: Array<{ key: string; status: CheckStatus; title: string; detail: string }> = []
    if (mesh) {
        checks.push(
            mesh.openEdges === 0
                ? { key: 'holes', status: 'good', title: t('checks.holes.title'), detail: t('checks.holes.good') }
                : {
                      key: 'holes',
                      status: 'fix',
                      title: t('checks.holes.title'),
                      detail: t('checks.holes.bad', { holes: formatNum(mesh.holes), edges: formatNum(mesh.openEdges) }),
                  },
            mesh.nonManifoldEdges === 0
                ? { key: 'manifold', status: 'good', title: t('checks.manifold.title'), detail: t('checks.manifold.good') }
                : {
                      key: 'manifold',
                      status: 'fix',
                      title: t('checks.manifold.title'),
                      detail: t('checks.manifold.bad', { edges: formatNum(mesh.nonManifoldEdges) }),
                  },
            mesh.flippedEdges === 0 && mesh.invertedShells === 0
                ? autoOriented > 0
                    ? {
                          key: 'normals',
                          status: 'info',
                          title: t('checks.normals.title'),
                          detail: t('checks.normals.fixed', { count: formatNum(autoOriented) }),
                      }
                    : { key: 'normals', status: 'good', title: t('checks.normals.title'), detail: t('checks.normals.good') }
                : {
                      key: 'normals',
                      status: 'warn',
                      title: t('checks.normals.title'),
                      detail: t('checks.normals.bad', {
                          edges: formatNum(mesh.flippedEdges),
                          shells: formatNum(mesh.invertedShells),
                      }),
                  },
            mesh.shells <= 1
                ? { key: 'shells', status: 'good', title: t('checks.shells.title'), detail: t('checks.shells.good') }
                : {
                      key: 'shells',
                      status: 'info',
                      title: t('checks.shells.title'),
                      detail: t('checks.shells.many', { count: formatNum(mesh.shells) }),
                  }
        )
        if (mesh.degenerateTriangles > 0) {
            checks.push({
                key: 'degenerate',
                status: 'info',
                title: t('checks.degenerate.title'),
                detail: t('checks.degenerate.detail', { count: formatNum(mesh.degenerateTriangles) }),
            })
        }
    }
    if (box) {
        if (tiny) {
            checks.push({
                key: 'size',
                status: 'warn',
                title: t('checks.size.title'),
                detail: t('checks.size.tiny', { size: formatBuildDims(box) }),
            })
        } else if (!fitsAny) {
            checks.push({
                key: 'size',
                status: 'warn',
                title: t('checks.size.title'),
                detail: t('checks.size.tooBig', { size: formatBuildDims(box) }),
            })
        } else {
            checks.push({
                key: 'size',
                status: 'good',
                title: t('checks.size.title'),
                detail: t('checks.size.good', { size: formatBuildDims(box) }),
            })
        }
        const overhang = analysis?.overhangArea ?? 0
        if (analysis && analysis.surfaceArea > 0) {
            const ratio = Math.round((overhang / analysis.surfaceArea) * 100)
            checks.push({
                key: 'support',
                status: 'info',
                title: t('checks.support.title'),
                detail: ratio > 0 ? t('checks.support.ratio', { ratio }) : t('checks.support.none'),
            })
        }
    }

    const canRepair = mesh != null && !repair && isRepairable(mesh)
    const legend = highlights ? ISSUE_LEGEND.filter((l) => highlights[l.field].length > 0) : []
    const afterState = repair ? inspectCache.current.get(repair.repaired) : undefined
    const afterMesh = afterState?.outcome?.status === 'ok' ? afterState.outcome.result : null
    const afterVolume = afterState?.volume ?? null

    const reportLines: string[] = []
    if (repair) {
        const r = repair.report
        if (r.holesFilled > 0) reportLines.push(t('repair.report.holes', { count: formatNum(r.holesFilled), added: formatNum(r.holeTrianglesAdded) }))
        if (r.stitchedVertices > 0) reportLines.push(t('repair.report.stitched', { count: formatNum(r.stitchedVertices) }))
        if (r.duplicateRemoved > 0) reportLines.push(t('repair.report.duplicate', { count: formatNum(r.duplicateRemoved) }))
        if (r.internalFacesRemoved > 0) reportLines.push(t('repair.report.internal', { count: formatNum(r.internalFacesRemoved) }))
        if (r.degenerateRemoved > 0) reportLines.push(t('repair.report.degenerate', { count: formatNum(r.degenerateRemoved) }))
        if (r.fragmentsRemoved > 0)
            reportLines.push(t('repair.report.fragments', { count: formatNum(r.fragmentsRemoved), triangles: formatNum(r.fragmentTrianglesRemoved) }))
        if (r.flippedFixed > 0) reportLines.push(t('repair.report.flipped', { count: formatNum(r.flippedFixed) }))
    }

    const compareRows: Array<{ key: string; before: string; after: string | null; improved: boolean }> = repair
        ? [
              { key: 'holes', b: repair.before.holes, a: afterMesh?.holes },
              { key: 'openEdges', b: repair.before.openEdges, a: afterMesh?.openEdges },
              { key: 'nonManifold', b: repair.before.nonManifoldEdges, a: afterMesh?.nonManifoldEdges },
              { key: 'flipped', b: repair.before.flippedEdges, a: afterMesh?.flippedEdges },
              { key: 'shells', b: repair.before.shells, a: afterMesh?.shells },
              { key: 'triangles', b: repair.before.triangles, a: afterMesh?.triangles },
          ].map((row) => ({
              key: row.key,
              before: formatNum(row.b),
              after: row.a == null ? null : formatNum(row.a),
              improved: row.a != null && row.a < row.b && row.key !== 'triangles',
          }))
        : []
    if (repair) {
        compareRows.push({
            key: 'volume',
            before: repair.beforeVolume != null ? `${repair.beforeVolume.toFixed(1)} cm³` : '-',
            after: afterVolume != null ? `${afterVolume.toFixed(1)} cm³` : null,
            improved: false,
        })
    }

    const stageLabel = !meshDone && analysis ? t('stages.inspecting') : t(`stages.${stage ?? 'reading'}`)
    const faqs = t.raw('faqs') as Array<{ q: string; a: string }>

    const panel = (children: ReactNode, className?: string) => (
        <div className={cn('rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6', className)}>
            {children}
        </div>
    )

    const sampleButton = (path: string, name: string, label: string, accent?: boolean) => (
        <button
            type="button"
            onClick={() => void loadSample(path, name)}
            disabled={loadingSample != null}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-black disabled:opacity-50',
                accent
                    ? 'border-teal-400/40 bg-teal-400/10 text-teal-200 hover:text-white'
                    : 'border-white/15 bg-white/5 text-white/70 hover:text-white'
            )}
        >
            {loadingSample === name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : accent ? <Wrench className="h-3.5 w-3.5" /> : null}
            {label}
        </button>
    )

    return (
        <main className="relative flex min-h-screen flex-col overflow-x-clip bg-[#020617] text-slate-50 selection:bg-teal-500/30">
            <Header />
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b_0%,#020617_70%)]" />
                <div className="absolute right-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
            </div>

            <section className="relative z-10 pb-8 pt-32 sm:pt-36">
                <div className="container mx-auto max-w-5xl px-4 text-center sm:px-6">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-indigo-200">
                        <ScanSearch className="h-3.5 w-3.5" />
                        {t('eyebrow')}
                    </div>
                    <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl break-keep">
                        {t('title')} <span className="text-teal-400">{t('titleAccent')}</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm font-bold leading-relaxed text-white/55 sm:text-base break-keep">
                        {t('subtitle')}
                    </p>
                </div>
            </section>

            <section className="relative z-10 pb-16">
                <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                    {!file ? (
                        <div className="mx-auto max-w-3xl space-y-4">
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => inputRef.current?.click()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    setDragging(true)
                                }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    setDragging(false)
                                    const dropped = getModelFileFromDataTransfer(e.dataTransfer)
                                    if (!dropped) setNotice(t('invalidType'))
                                    else acceptFile(dropped)
                                }}
                                className={cn(
                                    'flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed px-6 py-16 text-center transition-colors',
                                    dragging
                                        ? 'border-teal-400 bg-teal-400/10'
                                        : 'border-white/15 bg-white/[0.03] hover:border-teal-400/50'
                                )}
                            >
                                <Upload className="mb-4 h-10 w-10 text-teal-300" />
                                <p className="text-lg font-black text-white break-keep">{t('dropTitle')}</p>
                                <p className="mt-1 text-sm font-bold text-white/45 break-keep">{t('dropHint')}</p>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept={MODEL_FILE_ACCEPT_STRING}
                                    className="hidden"
                                    onChange={(e) => {
                                        acceptFile(e.target.files?.[0])
                                        e.target.value = ''
                                    }}
                                />
                            </div>
                            {notice ? (
                                <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100 break-keep">
                                    {notice}
                                </p>
                            ) : null}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="flex items-center gap-2 text-[12px] font-bold text-white/50 break-keep">
                                    <Lock className="h-3.5 w-3.5 shrink-0 text-teal-300" /> {t('privacy')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {sampleButton(SAMPLE_PATH, SAMPLE_NAME, t('sampleCta'))}
                                    {sampleButton(BROKEN_SAMPLE_PATH, BROKEN_SAMPLE_NAME, t('sampleBrokenCta'), true)}
                                </div>
                            </div>
                            <div className="grid gap-3 pt-4 sm:grid-cols-2">
                                {(t.raw('whatWeCheck') as Array<{ title: string; desc: string }>).map((item) => (
                                    <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-sm font-black text-white break-keep">{item.title}</p>
                                        <p className="mt-1 text-[12px] font-medium leading-relaxed text-white/50 break-keep">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                            <div className="space-y-4">
                                <div className="relative h-[340px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080808] sm:h-[440px]">
                                    <Scene compact highlights={showIssues ? highlights : null} />
                                    {repair || legend.length > 0 ? (
                                        <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-5rem)] flex-col items-start gap-2">
                                            {repair ? (
                                                <div className="pointer-events-auto inline-flex rounded-full border border-white/15 bg-slate-950/80 p-1 backdrop-blur">
                                                    {[
                                                        { id: 'original', label: t('repair.viewOriginal'), target: repair.original, active: !viewingRepaired },
                                                        { id: 'repaired', label: t('repair.viewRepaired'), target: repair.repaired, active: viewingRepaired },
                                                    ].map((v) => (
                                                        <button
                                                            key={v.id}
                                                            type="button"
                                                            onClick={() => switchTo(v.target)}
                                                            disabled={busy}
                                                            className={cn(
                                                                'rounded-full px-3 py-1 text-[11px] font-black transition-colors',
                                                                v.active ? 'bg-teal-400 text-slate-950' : 'text-white/60 hover:text-white'
                                                            )}
                                                        >
                                                            {v.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {legend.length > 0 ? (
                                                <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/80 px-3 py-1.5 backdrop-blur">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowIssues((v) => !v)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-black text-white/80 hover:text-white"
                                                    >
                                                        {showIssues ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                                        {t('issues.show')}
                                                    </button>
                                                    {showIssues
                                                        ? legend.map((l) => (
                                                              <span key={l.key} className="inline-flex items-center gap-1 text-[10px] font-bold text-white/60">
                                                                  <span className={cn('h-2 w-2 rounded-full', l.color)} />
                                                                  {t(`issues.${l.key}`)}
                                                              </span>
                                                          ))
                                                        : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="min-w-0 truncate text-sm font-black text-white/70" title={file.name}>
                                        {file.name}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={checkAnother}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-black text-white/70 hover:text-white"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" /> {t('checkAnother')}
                                    </button>
                                </div>
                                {analysis
                                    ? panel(
                                          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                              {[
                                                  { label: t('stats.size'), value: box ? formatBuildDims(box) : '-' },
                                                  { label: t('stats.volume'), value: `${analysis.volume.toFixed(1)} cm³` },
                                                  { label: t('stats.surface'), value: `${analysis.surfaceArea.toFixed(1)} cm²` },
                                                  { label: t('stats.triangles'), value: mesh ? formatNum(mesh.triangles) : '-' },
                                              ].map((s) => (
                                                  <div key={s.label}>
                                                      <dt className="text-[11px] font-black text-white/40">{s.label}</dt>
                                                      <dd className="mt-1 text-sm font-black tabular-nums text-white">{s.value}</dd>
                                                  </div>
                                              ))}
                                          </dl>
                                      )
                                    : null}
                                {box && specs
                                    ? panel(
                                          <div>
                                              <p className="text-sm font-black text-white">{t('fitTitle')}</p>
                                              <div className="mt-3 grid grid-cols-3 gap-2">
                                                  {fitByMethod.map((f) => (
                                                      <div
                                                          key={f.method}
                                                          className={cn(
                                                              'rounded-xl border px-3 py-2',
                                                              f.fits
                                                                  ? 'border-emerald-400/25 bg-emerald-500/10'
                                                                  : 'border-white/10 bg-white/[0.02]'
                                                          )}
                                                      >
                                                          <p className="text-[12px] font-black text-white">
                                                              {f.method.toUpperCase()}{' '}
                                                              <span className={f.fits ? 'text-emerald-300' : 'text-white/40'}>
                                                                  {f.fits ? t('fitYes') : t('fitNo')}
                                                              </span>
                                                          </p>
                                                          {f.max ? (
                                                              <p className="mt-0.5 text-[10px] font-bold text-white/40">
                                                                  {t('fitMax', { max: formatBuildDims(f.max) })}
                                                              </p>
                                                          ) : null}
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )
                                    : null}
                                {repair
                                    ? panel(
                                          <div>
                                              <p className="text-sm font-black text-white">{t('repair.compareTitle')}</p>
                                              <table className="mt-3 w-full text-[12px]">
                                                  <thead>
                                                      <tr className="text-left text-[11px] font-black text-white/40">
                                                          <th className="pb-2 font-black">{t('repair.colItem')}</th>
                                                          <th className="pb-2 text-right font-black">{t('repair.colBefore')}</th>
                                                          <th className="pb-2 text-right font-black">{t('repair.colAfter')}</th>
                                                      </tr>
                                                  </thead>
                                                  <tbody>
                                                      {compareRows.map((row) => (
                                                          <tr key={row.key} className="border-t border-white/5">
                                                              <td className="py-1.5 font-bold text-white/70">{t(`repair.rows.${row.key}`)}</td>
                                                              <td className="py-1.5 text-right font-black tabular-nums text-white/50">{row.before}</td>
                                                              <td
                                                                  className={cn(
                                                                      'py-1.5 text-right font-black tabular-nums',
                                                                      row.improved ? 'text-emerald-300' : 'text-white'
                                                                  )}
                                                              >
                                                                  {row.after ?? t('repair.pending')}
                                                              </td>
                                                          </tr>
                                                      ))}
                                                  </tbody>
                                              </table>
                                          </div>
                                      )
                                    : null}
                            </div>

                            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                                {busy ? (
                                    panel(
                                        <div className="flex items-center gap-3 py-6">
                                            <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
                                            <p className="text-sm font-black text-white/70">{stageLabel}</p>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        {verdict ? (
                                            <div className={cn('rounded-[1.75rem] border p-5 sm:p-6', VERDICT_STYLE[verdict])}>
                                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                                                    {viewingRepaired ? t('repair.verdictEyebrow') : t('verdictEyebrow')}
                                                </p>
                                                <p className="mt-2 text-2xl font-black text-white break-keep">
                                                    {t(`verdict.${verdict}.title`)}
                                                </p>
                                                <p className="mt-2 text-[13px] font-medium leading-relaxed text-white/70 break-keep">
                                                    {verdict === 'good' && autoOriented > 0
                                                        ? t('verdict.good.descAutoFixed')
                                                        : t(`verdict.${verdict}.desc`)}
                                                </p>
                                            </div>
                                        ) : (
                                            panel(
                                                <p className="text-[13px] font-bold leading-relaxed text-white/70 break-keep">
                                                    {current?.outcome?.status === 'too_large'
                                                        ? t('tooComplex', { count: formatNum(current.outcome.triangles) })
                                                        : t('inspectFail')}
                                                </p>
                                            )
                                        )}
                                        {analysisError ? (
                                            <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[12px] font-bold text-amber-100 break-keep">
                                                {analysisError}
                                            </p>
                                        ) : null}
                                        {canRepair
                                            ? panel(
                                                  <div className="space-y-3">
                                                      <p className="flex items-center gap-2 text-sm font-black text-white">
                                                          <Wrench className="h-4 w-4 text-teal-300" /> {t('repair.title')}
                                                      </p>
                                                      <p className="text-[12px] font-medium leading-relaxed text-white/55 break-keep">
                                                          {t('repair.desc')}
                                                      </p>
                                                      {mesh && mesh.shells > 1 ? (
                                                          <label className="flex cursor-pointer items-center gap-2 text-[12px] font-bold text-white/70">
                                                              <input
                                                                  type="checkbox"
                                                                  checked={removeFragments}
                                                                  onChange={(e) => setRemoveFragments(e.target.checked)}
                                                                  className="h-4 w-4 accent-teal-400"
                                                              />
                                                              {t('repair.removeFragments')}
                                                          </label>
                                                      ) : null}
                                                      <button
                                                          type="button"
                                                          onClick={() => void runRepair()}
                                                          disabled={repairing}
                                                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-400/40 bg-teal-400/15 px-5 py-3 text-sm font-black text-teal-100 transition-colors hover:bg-teal-400/25 disabled:opacity-60"
                                                      >
                                                          {repairing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                                                          {repairing ? t('repair.running') : t('repair.run')}
                                                      </button>
                                                      {repairMessage ? (
                                                          <p className="text-[12px] font-bold leading-relaxed text-amber-200 break-keep">{repairMessage}</p>
                                                      ) : null}
                                                      <p className="text-[11px] font-medium leading-relaxed text-white/40 break-keep">
                                                          {t('repair.limitNote')}
                                                      </p>
                                                  </div>
                                              )
                                            : null}
                                        {repair
                                            ? panel(
                                                  <div className="space-y-3">
                                                      {restored ? (
                                                          <p className="rounded-xl border border-teal-400/30 bg-teal-500/10 px-3 py-2 text-[12px] font-bold text-teal-100 break-keep">
                                                              {t('repair.restored')}
                                                          </p>
                                                      ) : null}
                                                      <p className="flex items-center gap-2 text-sm font-black text-white">
                                                          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t('repair.reportTitle')}
                                                      </p>
                                                      <ul className="space-y-1.5">
                                                          {reportLines.map((line) => (
                                                              <li key={line} className="flex gap-2 text-[12px] font-medium leading-relaxed text-white/70 break-keep">
                                                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                                                                  {line}
                                                              </li>
                                                          ))}
                                                      </ul>
                                                      {repair.report.holesSkipped > 0 ? (
                                                          <p className="text-[12px] font-bold leading-relaxed text-amber-200 break-keep">
                                                              {t('repair.report.skipped', { count: formatNum(repair.report.holesSkipped) })}
                                                          </p>
                                                      ) : null}
                                                      {afterMesh && afterMesh.nonManifoldEdges > 0 ? (
                                                          <p className="text-[12px] font-bold leading-relaxed text-amber-200 break-keep">
                                                              {t('repair.remainNonManifold', { count: formatNum(afterMesh.nonManifoldEdges) })}
                                                          </p>
                                                      ) : null}
                                                      <button
                                                          type="button"
                                                          onClick={() => void downloadRepaired()}
                                                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-white/15"
                                                      >
                                                          {userId ? <Download className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                                                          {userId ? t('repair.download') : t('repair.downloadLogin')}
                                                      </button>
                                                      <p className="text-[11px] font-medium leading-relaxed text-white/45 break-keep">
                                                          {userId ? t('repair.stlNote') : t('repair.downloadLoginHint')}
                                                      </p>
                                                      <p className="text-[11px] font-medium leading-relaxed text-white/40 break-keep">
                                                          {t('repair.limitNote')}
                                                      </p>
                                                  </div>
                                              )
                                            : null}
                                        {checks.length
                                            ? panel(
                                                  <ul className="space-y-3">
                                                      {checks.map((c) => {
                                                          const { icon: Icon, className } = STATUS_STYLE[c.status]
                                                          return (
                                                              <li key={c.key} className="flex gap-3">
                                                                  <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', className)} />
                                                                  <div>
                                                                      <p className="text-sm font-black text-white">{c.title}</p>
                                                                      <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-white/55 break-keep">
                                                                          {c.detail}
                                                                      </p>
                                                                  </div>
                                                              </li>
                                                          )
                                                      })}
                                                  </ul>
                                              )
                                            : null}
                                        {verdict && verdict !== 'good' && !canRepair && !repair ? (
                                            panel(
                                                <div className="space-y-2">
                                                    <p className="text-sm font-black text-white">{t('fixTitle')}</p>
                                                    <p className="text-[12px] font-medium leading-relaxed text-white/55 break-keep">
                                                        {t('fixBody')}
                                                    </p>
                                                    <Link
                                                        href="/guides/fixing-stl-file-errors"
                                                        className="inline-flex items-center gap-1 text-[12px] font-black text-indigo-300 hover:text-indigo-200"
                                                    >
                                                        {t('fixGuide')} <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </div>
                                            )
                                        ) : null}
                                    </>
                                )}

                                <div className="space-y-2 rounded-[1.75rem] border border-teal-400/25 bg-gradient-to-b from-teal-500/10 to-slate-950/60 p-5 sm:p-6">
                                    <button
                                        type="button"
                                        onClick={goQuote}
                                        disabled={!analysis && !isSample}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.25)] transition-all hover:bg-teal-300 disabled:opacity-50"
                                    >
                                        {repair ? t('repair.ctaQuote') : isSample ? t('ctaQuoteSample') : t('ctaQuote')}{' '}
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                    <p className="px-1 text-[11px] font-medium leading-relaxed text-white/50 break-keep">
                                        {repair ? t('repair.ctaQuoteHint') : isSample ? t('ctaQuoteSampleHint') : t('ctaQuoteHint')}
                                    </p>
                                </div>
                                <p className="flex items-start gap-2 px-1 text-[11px] font-bold leading-relaxed text-white/40 break-keep">
                                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t('privacy')}
                                </p>
                            </aside>
                        </div>
                    )}
                </div>
            </section>

            <section className="relative z-10 pb-24">
                <div className="container mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_400px]">
                    <div>
                        <h2 className="mb-4 text-xl font-black text-white">{t('faqTitle')}</h2>
                        <div className="space-y-3">
                            {faqs.map((f) => (
                                <details
                                    key={f.q}
                                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 open:border-white/20"
                                >
                                    <summary className="cursor-pointer list-none text-sm font-black text-white break-keep">
                                        {f.q}
                                    </summary>
                                    <p className="mt-2 text-[13px] font-medium leading-relaxed text-white/55 break-keep">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className="mb-4 text-xl font-black text-white">{t('guidesTitle')}</h2>
                        <div className="space-y-2">
                            {[
                                { href: '/guides/fixing-stl-file-errors', label: t('guideFix') },
                                { href: '/guides/3d-printing-file-preparation', label: t('guidePrep') },
                                { href: '/guides/minimum-wall-thickness', label: t('guideWall') },
                                { href: '/use-cases', label: t('guideUseCases') },
                            ].map((g) => (
                                <Link
                                    key={g.href}
                                    href={g.href}
                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-black text-white/75 transition-colors hover:border-teal-400/30 hover:text-white"
                                >
                                    {g.label} <ArrowRight className="h-4 w-4 text-teal-300" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
