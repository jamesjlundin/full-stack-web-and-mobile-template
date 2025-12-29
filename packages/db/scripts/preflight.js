/**
 * Preflight check for database migrations.
 * Ensures DATABASE_URL is set before attempting migrations.
 */

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
      "Please set DATABASE_URL before running migrations.",
  );
}

console.log("DB preflight OK");
