import type { Knex } from "knex";

const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: "src/infra/database/migrations",
    extension: "ts",
  },
};

export default {
  development: config,
};
