import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db, pool } from "./client.js";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("migrations applied");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
