import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default (in-memory, per-request) cache is fine for this demo. If you add
// ISR/data-cache-dependent routes later, swap in the KV or R2 incremental
// cache overrides — see https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({});
