CREATE TYPE "public"."job_application_status" AS ENUM('submitted', 'shortlisted', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."job_category" AS ENUM('design', 'development', 'marketing', 'writing', 'video', 'data');--> statement-breakpoint
CREATE TYPE "public"."job_location_type" AS ENUM('remote', 'onsite', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"employer_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "job_category" NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"budget_poisha" integer NOT NULL,
	"deadline" date NOT NULL,
	"location_type" "job_location_type" DEFAULT 'remote' NOT NULL,
	"location" text,
	"status" "job_status" DEFAULT 'open' NOT NULL,
	"hired_application_id" text,
	"hired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_budget_positive" CHECK ("jobs"."budget_poisha" > 0),
	CONSTRAINT "jobs_nonempty_title" CHECK (length(trim("jobs"."title")) > 0)
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"student_id" text NOT NULL,
	"message" text NOT NULL,
	"proposed_price_poisha" integer NOT NULL,
	"delivery_days" integer NOT NULL,
	"approach" text DEFAULT '' NOT NULL,
	"suitability" text DEFAULT '' NOT NULL,
	"status" "job_application_status" DEFAULT 'submitted' NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_applications_price_positive" CHECK ("job_applications"."proposed_price_poisha" > 0),
	CONSTRAINT "job_applications_delivery_range" CHECK ("job_applications"."delivery_days" between 1 and 365)
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_users_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_hired_application_id_job_applications_id_fk" FOREIGN KEY ("hired_application_id") REFERENCES "public"."job_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jobs_status_created_idx" ON "jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "jobs_employer_created_idx" ON "jobs" USING btree ("employer_id","created_at");--> statement-breakpoint
CREATE INDEX "jobs_category_status_idx" ON "jobs" USING btree ("category","status");--> statement-breakpoint
CREATE UNIQUE INDEX "job_applications_job_student_idx" ON "job_applications" USING btree ("job_id","student_id");--> statement-breakpoint
CREATE INDEX "job_applications_job_status_idx" ON "job_applications" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "job_applications_student_created_idx" ON "job_applications" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "job_applications_one_hire_idx" ON "job_applications" USING btree ("job_id") WHERE "job_applications"."status" = 'hired';