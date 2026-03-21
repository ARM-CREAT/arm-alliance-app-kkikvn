ALTER TABLE "leadership" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "leadership" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "leadership" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "leadership" ADD COLUMN "order_index" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "uploaded_by" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "published_at" timestamp with time zone;