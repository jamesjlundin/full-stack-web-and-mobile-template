UPDATE "users" SET "name" = '' WHERE "name" IS NULL;
ALTER TABLE "users" ALTER COLUMN "name" SET DEFAULT '';
