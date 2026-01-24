import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(req: NextRequest) {
    const status: any = {
        step: 'init',
        globals: {
            hasCrypto: typeof crypto !== 'undefined',
            hasTextEncoder: typeof TextEncoder !== 'undefined'
        },
        env: null
    };

    try {
        // 1. Context Access
        status.step = 'context_access';
        let env: { DB?: { prepare: (q: string) => { first: () => Promise<unknown> } } } | null = null;
        try {
            env = getCloudflareContext().env as { DB?: { prepare: (q: string) => { first: () => Promise<unknown> } } };
            status.ctxFound = true;
        } catch (e: any) {
            status.ctxError = e?.message;
            status.ctxFound = false;
        }

        status.hasEnv = !!env;
        status.hasDB = !!(env && env.DB);

        // 2. Database Check
        if (env?.DB) {
            status.step = 'db_query';
            const user = await env.DB.prepare("SELECT * FROM users WHERE email = 'admin@wow3d.com'").first();
            status.userFound = !!user;

            if (user) {
                const u = user as Record<string, unknown>;
                status.userRole = u.role;
                status.userHashPrefix = (u.password_hash as string)?.substring(0, 10);

                // 3. Hash Check
                status.step = 'hash_check';
                const encoder = new TextEncoder();
                const data = encoder.encode('admin1234');
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const calcHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                status.calcHash = calcHash;
                status.match = (calcHash === u.password_hash);
            }
        } else {
            status.message = "DB Binding Missing (Check Cloudflare Dashboard).";
        }

        return NextResponse.json(status);

    } catch (error: any) {
        return NextResponse.json({
            fatal_error: true,
            step: status.step,
            message: error.message,
            stack: error.stack,
            partial_status: status
        }, { status: 200 });
    }
}
