const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** GET /api/health - 500 원인 확인: try-catch로 에러 시 200+err 반환 */
export async function GET() {
    try {
        return new Response(JSON.stringify({ ok: true, t: Date.now() }), {
            status: 200,
            headers: JSON_HEADERS,
        });
    } catch (e) {
        return new Response(
            JSON.stringify({ ok: false, err: String(e), n: (e as Error)?.name }),
            { status: 200, headers: JSON_HEADERS }
        );
    }
}
