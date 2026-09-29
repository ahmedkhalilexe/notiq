import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("subscribers", (table) => {
    table.string("external_id", 255).nullable();
    table.string("phone", 50).nullable();

    table.string("email").nullable().alter();

    table.dropUnique(["email"]);

    table.dropUnique(["tenant_id", "email"]);

    table.index(["tenant_id", "deleted_at"]);
  });

  await knex.raw(`
        CREATE UNIQUE INDEX subscribers_tenant_email_active_unique 
        ON subscribers (tenant_id, email) 
        WHERE deleted_at IS NULL AND email IS NOT NULL;
      `);

  await knex.raw(`
        CREATE UNIQUE INDEX subscribers_tenant_external_id_active_unique 
        ON subscribers (tenant_id, external_id) 
        WHERE deleted_at IS NULL AND external_id IS NOT NULL;
      `);

  await knex.schema.alterTable("subscriber_channels", (table) => {
    table.boolean("enabled").notNullable().defaultTo(true);
  });

  await knex.raw(`
        ALTER TABLE subscriber_channels 
        ALTER COLUMN channel TYPE VARCHAR(50);
      `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `DROP INDEX IF EXISTS subscribers_tenant_email_active_unique;`,
  );
  await knex.raw(
    `DROP INDEX IF EXISTS subscribers_tenant_external_id_active_unique;`,
  );

  await knex.schema.alterTable("subscribers", (table) => {
    table.dropIndex(["tenant_id", "deleted_at"]);
    table.unique(["tenant_id", "email"]);
    table.string("email").notNullable().unique().alter();
    table.dropColumn("phone");
    table.dropColumn("external_id");
  });

  await knex.schema.alterTable("subscriber_channels", (table) => {
    table.dropColumn("enabled");
  });
}
