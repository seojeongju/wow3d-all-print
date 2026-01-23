import type { Env } from '../env';

// Cloudflare Pages Functions 설정
export const onRequest = async (context: { env: Env; request: Request }) => {
    return new Response("Wow3D API");
};
