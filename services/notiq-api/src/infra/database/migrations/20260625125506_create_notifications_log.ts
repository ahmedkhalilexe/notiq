import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("notifications_log", (table) => {
    table.uuid("key").primary();

    table
      .uuid("notification_id")
      .notNullable()
      .references("id")
      .inTable("notifications")
      .onDelete("CASCADE");

    table.enum("status", ["delivered", "pending", "failed", "retrying"]);

    table.timestamps(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("notifications_log");
}
