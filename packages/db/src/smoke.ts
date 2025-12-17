import { sql } from "drizzle-orm";

import { createLocalDb } from "./client.js";

async function main() {
  const { db, pool } = createLocalDb();
  try {
    const result = await db.execute(sql`select now() as now`);
    const now = result.rows[0]?.now;
    console.log("Current time:", now);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
