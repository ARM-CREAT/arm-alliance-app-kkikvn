ALTER TABLE "conferences" ADD COLUMN "participant_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "conferences" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conferences" ADD COLUMN "ended_at" timestamp with time zone;