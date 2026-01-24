export const runtime = 'edge';

/** GET /api/health - next/server 제거, Web API만 사용 (CF Edge 500 원인 격리) */
export async function GET() {
    return new Response(JSON.stringify({ ok: true, t: Date.now() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
