import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tenants", (table) => {
    table.uuid("id").primary();

    table.string("name").notNullable();
    table.string("email").unique().notNullable();
    table.string("password").notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("tenants");
}
