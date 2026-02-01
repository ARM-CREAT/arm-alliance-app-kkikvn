CREATE TABLE "video_conferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_at" timestamp NOT NULL,
	"meeting_url" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "leadership" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "political_program" ADD COLUMN "created_by" text;