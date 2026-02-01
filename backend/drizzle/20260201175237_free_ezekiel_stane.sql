CREATE TABLE "cercles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cercles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "communes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cercle_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "communes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cotisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"type" text NOT NULL,
	"payment_method" text NOT NULL,
	"transaction_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"election_type" text NOT NULL,
	"region" text NOT NULL,
	"cercle" text NOT NULL,
	"commune" text NOT NULL,
	"bureau_vote" text NOT NULL,
	"results_data" jsonb NOT NULL,
	"pv_photo_url" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"verified_by" text,
	"verified_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"sender_id" text NOT NULL,
	"target_role" text,
	"target_region" text,
	"target_cercle" text,
	"target_commune" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"full_name" text NOT NULL,
	"nina" text,
	"commune" text NOT NULL,
	"profession" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"membership_number" text NOT NULL,
	"qr_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"role" text DEFAULT 'militant' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_profiles_membership_number_unique" UNIQUE("membership_number"),
	CONSTRAINT "member_profiles_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "regions_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "regions_table_name_unique" UNIQUE("name"),
	CONSTRAINT "regions_table_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "cercles" ADD CONSTRAINT "cercles_region_id_regions_table_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communes" ADD CONSTRAINT "communes_cercle_id_cercles_id_fk" FOREIGN KEY ("cercle_id") REFERENCES "public"."cercles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_member_id_member_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_member_id_member_profiles_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member_profiles"("id") ON DELETE cascade ON UPDATE no action;