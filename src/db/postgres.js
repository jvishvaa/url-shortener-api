import PG from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = PG;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test Connections
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", () => {
  console.error("❌ PostgreSQL error:", err.message);
});
