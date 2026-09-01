import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAdminAuth } from '@/lib/api-utils'
import {
    getImageTo3DProviderSetting,
    getProviderAvailability,
    parseImageTo3DProvider,
    providerDisplayName,
    setImageTo3DProviderSetting,
    type ImageTo3DProvider,
} from '@/lib/image-to-3d-provider'
import {
    getTripoBalance,
    resolveTripoApiKey,
    resolveTripoModelVersion,
    TRIPO_MODEL_STANDARD,
} from '@/lib/tripo'

/**
 * GET /api/admin/meshy/provider
 * 활성 프로바이더 및 API 키 설정 여부
 */
export async function GET(req: NextRequest) {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })

    const auth = await requireAdminAuth(req, env.DB)
    if (auth instanceof Response) return auth

    const envRecord = env as unknown as Record<string, unknown>
    const availability = getProviderAvailability(envRecord)
    const provider = await getImageTo3DProviderSetting(env.DB, auth.storeId)

    let tripoBalance: { balance: number; frozen: number } | null = null
    let tripoBalanceError: string | null = null
    const tripoKey = resolveTripoApiKey(envRecord)
    if (tripoKey) {
        try {
            tripoBalance = await getTripoBalance(tripoKey)
        } catch (e) {
            tripoBalanceError = e instanceof Error ? e.message : 'Tripo 잔액 조회 실패'
        }
    }

    return NextResponse.json({
        success: true,
        data: {
            provider,
            providerLabel: providerDisplayName(provider),
            availability,
            canUseMeshy: availability.meshy,
            canUseTripo: availability.tripo,
            activeReady:
                (provider === 'meshy' && availability.meshy) ||
                (provider === 'tripo' && availability.tripo),
            tripo: {
                apiVersion: 'v3',
                modelVersion: resolveTripoModelVersion(envRecord),
                defaultModel: TRIPO_MODEL_STANDARD,
                balance: tripoBalance,
                balanceError: tripoBalanceError,
            },
        },
    })
}

/**
 * POST /api/admin/meshy/provider
 * body: { provider: 'meshy' | 'tripo' }
 */
export async function POST(req: NextRequest) {
    const { env } = getCloudflareContext()
    if (!env?.DB) return NextResponse.json({ error: 'DB를 사용할 수 없습니다' }, { status: 503 })

    const auth = await requireAdminAuth(req, env.DB)
    if (auth instanceof Response) return auth

    try {
        const body = (await req.json()) as { provider?: string }
        const provider = parseImageTo3DProvider(body.provider)
        const availability = getProviderAvailability(env as unknown as Record<string, unknown>)

        if (provider === 'meshy' && !availability.meshy) {
            return NextResponse.json(
                { error: 'Meshy API 키(MESHY_API_KEY)가 설정되지 않았습니다.' },
                { status: 400 }
            )
        }
        if (provider === 'tripo' && !availability.tripo) {
            return NextResponse.json(
                { error: 'Tripo API 키(TRIPO_API_KEY 또는 TRIPO3D_API_KEY)가 설정되지 않았습니다.' },
                { status: 400 }
            )
        }

        await setImageTo3DProviderSetting(env.DB, provider as ImageTo3DProvider, auth.storeId)

        return NextResponse.json({
            success: true,
            data: {
                provider,
                providerLabel: providerDisplayName(provider),
                availability,
            },
        })
    } catch (e) {
        console.error('POST /api/admin/meshy/provider', e)
        return NextResponse.json({ error: '프로바이더 저장 실패' }, { status: 500 })
    }
}
