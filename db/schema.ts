import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const statsSource = pgEnum("stats_source", ["github", "leetcode"]);

export const statsSnapshots = pgTable(
  "stats_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: statsSource("source").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    schemaVersion: integer("schema_version").default(1).notNull(),
  },
  (table) => [
    index("stats_snapshots_source_fetched_at_idx").on(
      table.source,
      table.fetchedAt,
    ),
  ],
);
