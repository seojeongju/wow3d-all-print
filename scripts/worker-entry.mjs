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
        for (const path of ['/api/cron/order-auto-status', '/api/cron/news-collect']) {
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
