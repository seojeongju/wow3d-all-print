import openNext, {
    DOQueueHandler,
    DOShardedTagCache,
    BucketCachePurge,
} from '../.open-next/worker.js';

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };

export default {
    fetch(request, env, ctx) {
        return openNext.fetch(request, env, ctx);
    },
    async scheduled(event, env, ctx) {
        const req = new Request('https://cron.internal/api/cron/order-auto-status', {
            method: 'POST',
            headers: {
                'x-cron-secret': env.CRON_SECRET || '',
            },
        });
        ctx.waitUntil(openNext.fetch(req, env, ctx));
    },
};
