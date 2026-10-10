CREATE TYPE "public"."module_one_case_status" AS ENUM('open', 'under_review', 'resolved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."module_one_case_type" AS ENUM('report', 'dispute');--> statement-breakpoint
CREATE TABLE "moderation_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_user_id" text NOT NULL,
	"subject_user_id" text NOT NULL,
	"type" "module_one_case_type" NOT NULL,
	"status" "module_one_case_status" DEFAULT 'open' NOT NULL,
	"description" text NOT NULL,
	"assigned_admin_user_id" text,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_distinct_parties" CHECK ("moderation_cases"."reporter_user_id" <> "moderation_cases"."subject_user_id"),
	CONSTRAINT "cases_nonempty_description" CHECK (length(trim("moderation_cases"."description")) > 0)
);
--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_assigned_admin_user_id_users_id_fk" FOREIGN KEY ("assigned_admin_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cases_reporter_created_idx" ON "moderation_cases" USING btree ("reporter_user_id","created_at");--> statement-breakpoint
CREATE INDEX "cases_status_created_idx" ON "moderation_cases" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "cases_subject_created_idx" ON "moderation_cases" USING btree ("subject_user_id","created_at");