CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"es" text DEFAULT '' NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"qualifications" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "turns" jsonb;