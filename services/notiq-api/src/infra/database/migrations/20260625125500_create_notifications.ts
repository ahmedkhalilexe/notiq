import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("notifications", (table) => {
    table.uuid("id").primary();

    table
      .uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    table
      .uuid("subscriber_id")
      .notNullable()
      .references("id")
      .inTable("subscribers")
      .onDelete("CASCADE");
    table
      .uuid("template_id")
      .notNullable()
      .references("id")
      .inTable("templates")
      .onDelete("CASCADE");

    table.enum("status", ["queued", "processing", "delivered", "failed"]);
    table.jsonb("content");

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("notifications");
}
