ALTER TABLE "members" ALTER COLUMN "first_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "last_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "commune" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "profession" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "date_of_birth" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "members" DROP COLUMN "location";--> statement-breakpoint
UPDATE "members" SET "full_name" = COALESCE(NULLIF(CONCAT_WS(' ', "first_name", "last_name"), ''), "member_number") WHERE "full_name" IS NULL;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "full_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_phone_unique" UNIQUE("phone");