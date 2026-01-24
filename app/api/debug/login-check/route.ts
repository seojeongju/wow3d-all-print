import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

async function localHash(password: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
    let env: any;
    try {
        const ctx = getRequestContext();
        if (ctx && (ctx as any).env) {
            env = (ctx as any).env;
        }
    } catch (e) { }

    // Fallback
    if (!env) env = process.env;

    const status: any = {
        hasEnv: !!env,
        hasDB: !!env?.DB,
        runtime: process.env.NEXT_RUNTIME || 'unknown',
        checkResult: null
    };

    if (env?.DB) {
        try {
            const user = await env.DB.prepare("SELECT * FROM users WHERE email = 'admin@wow3d.com'").first();

            if (user) {
                const calculatedHash = await localHash('admin1234');
                const isMatch = calculatedHash === user.password_hash;

                status.checkResult = {
                    found: true,
                    id: user.id,
                    role: user.role,
                    storedHash: user.password_hash,
                    calculatedHash: calculatedHash,
                    isMatch: isMatch
                };
            } else {
                status.checkResult = { found: false };
            }
        } catch (error: any) {
            status.error = error.message;
            status.stack = error.stack;
        }
    }

    return NextResponse.json(status);
}
