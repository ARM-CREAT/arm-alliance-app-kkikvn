CREATE TABLE "message_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"member_profile_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "cercle" text;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "motivation" text;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_message_id_internal_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."internal_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_member_profile_id_member_profiles_id_fk" FOREIGN KEY ("member_profile_id") REFERENCES "public"."member_profiles"("id") ON DELETE cascade ON UPDATE no action;