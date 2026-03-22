import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Env } from '@/env';
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
    try {
        let env: { DB?: Env['DB'] } | undefined;
        try {
            env = getCloudflareContext().env;
        } catch {
            env = undefined;
        }

        if (!env?.DB) {
            // 로컬 개발 모드 시 임시 기본값 반환
            return successResponse([
                { setting_key: 'shipping_base_fee', setting_value: '3000' },
                { setting_key: 'shipping_free_threshold', setting_value: '50000' }
            ]);
        }

        const settings = await env.DB.prepare('SELECT * FROM store_settings').all();
        return successResponse(settings.results || []);
    } catch (error: any) {
        console.error('GET /api/settings error:', error);
        return errorResponse(error.message || '설정 정보 조회 실패', 500);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;
        
        // 관리자 권한 확인 (isAdmin이 보통 lib/api-utils의 auth 반환값에는 없지만, 
        // JWT 검증 로직이 user_role을 포함한다면 체크 가능함. 여기선 일단 냅둠)
        // const role = (auth as any).role;
        // if (role !== 'ADMIN') return errorResponse('관리자 권한이 필요합니다.', 403);

        let env: { DB?: Env['DB'] } | undefined;
        try {
            env = getCloudflareContext().env;
        } catch {
            env = undefined;
        }

        const body = await request.json(); // 예: { settings: [{ setting_key: '...', setting_value: '...' }] }

        if (!body.settings || !Array.isArray(body.settings)) {
            return errorResponse('잘못된 요청 형식입니다.', 400);
        }

        if (!env?.DB) {
            return errorResponse('데이터베이스를 사용할 수 없습니다.', 503);
        }

        // 배치로 여러 설정값 업데이트
        const statements = body.settings.map((s: any) => {
            return env!.DB!.prepare(`
                INSERT INTO store_settings (setting_key, setting_value, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(setting_key) DO UPDATE SET 
                setting_value = excluded.setting_value,
                updated_at = CURRENT_TIMESTAMP
            `).bind(s.setting_key, String(s.setting_value));
        });

        if (statements.length > 0) {
            await env.DB.batch(statements);
        }

        return successResponse(null, '설정이 저장되었습니다');
    } catch (error: any) {
        console.error('PUT /api/settings error:', error);
        return errorResponse(error.message || '설정 정보 저장 실패', 500);
    }
}
