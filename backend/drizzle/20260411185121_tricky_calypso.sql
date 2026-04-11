CREATE TABLE "inbox_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text NOT NULL,
	"author_email" text,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "membership_type" text DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "message" text;