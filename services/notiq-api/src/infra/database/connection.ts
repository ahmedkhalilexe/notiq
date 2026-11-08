// infra/database/connection.ts

import path from "node:path";
import { type Knex, knex } from "knex";

export type DbConnection = Knex;
export const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: path.join(__dirname, "migrations"),
    extension: "ts",
  },
});
