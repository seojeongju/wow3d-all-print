import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * 빌드 시 미리 만든 정적 페이지(가이드·소재·약관 등)를 Workers 정적 자산에서 바로 제공.
 * - 읽기 전용 캐시: ISR(revalidate)은 지원하지 않으므로 DB를 읽는 페이지는 force-dynamic 유지
 * - enableCacheInterception: 캐시 적중 시 Next 서버를 거치지 않고 응답
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
