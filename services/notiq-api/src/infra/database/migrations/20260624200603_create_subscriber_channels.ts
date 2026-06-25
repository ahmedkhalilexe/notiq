import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("subscriber_channels", (table) => {
    table.uuid("id").primary();

    table
      .uuid("subscriber_id")
      .notNullable()
      .references("id")
      .inTable("subscribers")
      .onDelete("CASCADE");

    table.enum("channel", ["channel", "in_app"]);
    table.string("value");
    table.unique(["subscriber_id", "channel"]);

    table.timestamps(true);
  });
}

export async function down(knex: Knex): Promise<void> {}
