ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_email_unique";--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_phone_unique";--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "first_name" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "last_name" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "member_number" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "location" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
UPDATE "members" SET "first_name" = 'Unknown' WHERE "first_name" IS NULL;--> statement-breakpoint
UPDATE "members" SET "last_name" = 'Unknown' WHERE "last_name" IS NULL;--> statement-breakpoint
WITH numbered_members AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num
  FROM "members"
  WHERE "member_number" IS NULL
)
UPDATE "members" m
SET "member_number" = 'ARM-' || LPAD(nm.row_num::text, 5, '0')
FROM numbered_members nm
WHERE m.id = nm.id AND m."member_number" IS NULL;--> statement-breakpoint
UPDATE "members" SET "location" = COALESCE("phone", 'Unknown') WHERE "location" IS NULL;--> statement-breakpoint
UPDATE "members" SET "created_at" = now() WHERE "created_at" IS NULL;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "member_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "location" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN IF EXISTS "full_name";--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN IF EXISTS "email";--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN IF EXISTS "region";--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN IF EXISTS "cercle";--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN IF EXISTS "commune";--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN IF EXISTS "membership_date";--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_member_number_unique";--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_member_number_unique" UNIQUE("member_number");--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_phone_unique";--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_phone_unique" UNIQUE("phone");