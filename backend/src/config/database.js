import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from the .env file");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

export const testDatabaseConnection = async () => {
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT NOW() AS current_time");

    console.log(
      "Database connection successful:",
      result.rows[0].current_time
    );
  } finally {
    client.release();
  }
};

export default pool;