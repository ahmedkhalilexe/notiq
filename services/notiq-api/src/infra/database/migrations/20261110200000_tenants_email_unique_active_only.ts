import type { Knex } from "knex";

// tenants.email was unique across all rows, so the email of a soft-deleted
// tenant could never register again (the insert failed with a 500). Scope the
// uniqueness to active tenants, as subscribers already do.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tenants", (table) => {
    table.dropUnique(["email"]);
  });

  await knex.raw(`
    CREATE UNIQUE INDEX tenants_email_active_unique
    ON tenants (email)
    WHERE deleted_at IS NULL;
  `);
}

// Fails if a deleted tenant's email has been registered again since `up`.
export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS tenants_email_active_unique;`);

  await knex.schema.alterTable("tenants", (table) => {
    table.unique(["email"]);
  });
}
