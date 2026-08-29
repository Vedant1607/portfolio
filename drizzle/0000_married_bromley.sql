CREATE TYPE "public"."stats_source" AS ENUM('github', 'leetcode');--> statement-breakpoint
CREATE TABLE "stats_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "stats_source" NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "stats_snapshots_source_fetched_at_idx" ON "stats_snapshots" USING btree ("source","fetched_at");