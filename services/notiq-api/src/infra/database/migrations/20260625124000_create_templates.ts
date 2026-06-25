import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("templates", (table) => {
    table.uuid("id").primary();

    table
      .uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");

    table.string("name").notNullable();
    table.enum("channel", ["channel", "in_app"]).notNullable();
    table.string("subject");
    table.text("body").notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("templates");
}
