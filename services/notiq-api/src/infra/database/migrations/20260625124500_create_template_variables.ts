import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("template_variables", (table) => {
    table.uuid("id").primary();

    table
      .uuid("template_id")
      .notNullable()
      .references("id")
      .inTable("templates")
      .onDelete("CASCADE");

    table.string("key");
    table.boolean("required");
    table.unique(["template_id", "key"]);

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("template_variables");
}
