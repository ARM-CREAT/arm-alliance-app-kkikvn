CREATE TABLE "calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initiator_id" text NOT NULL,
	"target_member_id" text NOT NULL,
	"call_type" text NOT NULL,
	"room_code" text NOT NULL,
	"join_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "calls_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
CREATE TABLE "conferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"host_name" text NOT NULL,
	"room_code" text NOT NULL,
	"join_url" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conferences_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
ALTER TABLE "political_program" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;