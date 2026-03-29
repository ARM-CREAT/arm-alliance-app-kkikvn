ALTER TABLE "members" ADD COLUMN "membership_number" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_membership_number_unique" UNIQUE("membership_number");--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_email_unique" UNIQUE("email");