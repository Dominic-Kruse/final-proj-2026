import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";


neonConfig.webSocketConstructor = globalThis.WebSocket;

const isTest = process.env.NODE_ENV === "test";
const connectionString = isTest
	? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
	: process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		isTest
			? "Missing TEST_DATABASE_URL (or DATABASE_URL fallback) for test environment"
			: "Missing DATABASE_URL for API environment",
	);
}

export const pool = new Pool({ connectionString });

export const db = drizzle(pool);