import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createLocalDb } from "./client.js";

async function main() {
  const { db, pool } = createLocalDb();
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("migrations applied");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
