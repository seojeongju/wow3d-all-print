import openNext, {
    DOQueueHandler,
    DOShardedTagCache,
    BucketCachePurge,
} from '../.open-next/worker.js';
import { handleInquiryInboundEmail } from './inquiry-email-handler.mjs';

const LOOKALIKE_ALLOWLIST = JSON.stringify([
    {
        relation: ['lookalikes/allowlist'],
        target: { namespace: 'web', site: 'https://wow3d.co.kr' },
    },
    {
        relation: ['lookalikes/allowlist'],
        target: { namespace: 'web', site: 'https://wow3dp.co.kr' },
    },
]);

/** wrangler.toml [triggers] crons 와 같은 문자열이어야 함 */
const QUOTE_REMINDER_CRON = '0 1 * * *';

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };

export default {
    fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (url.pathname === '/.well-known/assetlinks.json') {
            return new Response(LOOKALIKE_ALLOWLIST, {
                status: 200,
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'cache-control': 'public, max-age=3600',
                    'x-content-type-options': 'nosniff',
                },
            });
        }
        return openNext.fetch(request, env, ctx);
    },
    async scheduled(event, env, ctx) {
        // 견적 리마인드는 손님이 메일을 확인하기 좋은 오전(10:00 KST)에만 발송
        const paths =
            event.cron === QUOTE_REMINDER_CRON
                ? ['/api/cron/quote-reminders']
                : ['/api/cron/order-auto-status', '/api/cron/news-collect'];
        for (const path of paths) {
            const req = new Request(`https://cron.internal${path}`, {
                method: 'POST',
                headers: {
                    'x-cron-secret': env.CRON_SECRET || '',
                },
            });
            ctx.waitUntil(openNext.fetch(req, env, ctx));
        }
    },
    async email(message, env, ctx) {
        ctx.waitUntil(handleInquiryInboundEmail(message, env));
    },
};
