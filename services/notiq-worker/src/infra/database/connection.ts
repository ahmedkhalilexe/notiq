// infra/database/connection.ts
import knex from "knex";
import path from "path";
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
