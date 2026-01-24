import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const status: any = {
        step: 'init',
        globals: {
            hasProcess: typeof process !== 'undefined',
            hasCrypto: typeof crypto !== 'undefined',
            hasTextEncoder: typeof TextEncoder !== 'undefined'
        },
        env: null
    };

    try {
        // 1. Context Access
        status.step = 'context_access';
        let env: any = null;
        try {
            const ctx = getRequestContext();
            if (ctx) {
                status.ctxFound = true;
                env = (ctx as any).env;
            } else {
                status.ctxFound = false;
            }
        } catch (e: any) {
            status.ctxError = e.message;
        }

        // 2. Fallback
        if (!env && typeof process !== 'undefined') {
            status.step = 'process_fallback';
            try {
                env = process.env;
                status.usedFallback = true;
            } catch (e: any) {
                status.fallbackError = e.message;
            }
        }

        status.hasEnv = !!env;
        status.hasDB = !!(env && env.DB);

        // 3. Database Check
        if (env && env.DB) {
            status.step = 'db_query';
            const user = await env.DB.prepare("SELECT * FROM users WHERE email = 'admin@wow3d.com'").first();
            status.userFound = !!user;

            if (user) {
                status.userRole = user.role;
                status.userHashPrefix = user.password_hash?.substring(0, 10);

                // 4. Hash Check
                status.step = 'hash_check';
                const encoder = new TextEncoder();
                const data = encoder.encode('admin1234');
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const calcHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                status.calcHash = calcHash;
                status.match = (calcHash === user.password_hash);
            }
        } else {
            status.message = "DB Binding Missing. Please check Cloudflare Dashboard Settings.";
        }

        return NextResponse.json(status);

    } catch (error: any) {
        return NextResponse.json({
            fatal_error: true,
            step: status.step,
            message: error.message,
            stack: error.stack,
            partial_status: status
        }, { status: 200 }); // Return 200 to ensure user sees this JSON
    }
}
