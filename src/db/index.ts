import fs from "fs";
import path from "path";
import * as schema from "./schema";

const LOCAL_DB_PATH = path.join(process.cwd(), "db", "dev.db");

let _db: ReturnType<typeof Object> | null = null;

export async function getDb() {
  if (_db) return _db;

  const isCloudflare = typeof globalThis.caches !== "undefined";
  const cloudflareDb = (globalThis as { DB?: unknown }).DB;

  if (isCloudflare && cloudflareDb) {
    const { drizzle: drizzleD1 } = await import("drizzle-orm/d1");
    _db = drizzleD1(cloudflareDb as never, { schema });
  } else {
    const { default: Database } = await import("better-sqlite3");
    const { drizzle: drizzleSQLite } = await import("drizzle-orm/better-sqlite3");

    let dbFile = LOCAL_DB_PATH;
    if (process.env.VERCEL === "1") {
      const tmp = path.join("/tmp", "watch-desk.db");
      if (!fs.existsSync(tmp)) {
        fs.copyFileSync(LOCAL_DB_PATH, tmp);
      }
      dbFile = tmp;
    }

    const sqlite = new Database(dbFile);
    if (process.env.VERCEL !== "1") {
      sqlite.pragma("journal_mode = WAL");
    }
    _db = drizzleSQLite(sqlite, { schema });
  }

  return _db;
}

export function getDbSync() {
  if (!_db) {
    throw new Error("Database not initialized. Call getDb() first.");
  }
  return _db;
}

export * from "./schema";
