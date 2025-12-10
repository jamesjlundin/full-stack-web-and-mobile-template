import { sql } from "drizzle-orm";

import { db, pool } from "./client.js";

async function main() {
  const result = await db.execute(sql`select now() as now`);
  const now = result.rows[0]?.now;
  console.log("Current time:", now);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
