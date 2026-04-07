import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";


neonConfig.webSocketConstructor = globalThis.WebSocket;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export const db = drizzle(pool);