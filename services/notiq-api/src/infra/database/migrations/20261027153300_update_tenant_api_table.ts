import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tenant_api", (table) => {
    table.uuid("id").defaultTo(knex.fn.uuid()).notNullable().unique();
    table.string("name", 255).notNullable().defaultTo("Default");
    table.timestamp("revoked_at").nullable().defaultTo(null);
    table.index(["tenant_id", "revoked_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tenant_api", (table) => {
    table.dropIndex(["tenant_id", "revoked_at"]);
    table.dropColumn("revoked_at");
    table.dropColumn("name");
    table.dropColumn("id");
  });
}
