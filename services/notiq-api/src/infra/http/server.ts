import express from "express";
import { createRoutes } from "./routes";
import { ErrorHandler } from "./middleware/error-handler";

const app = express();
app.use(express.json());
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/v1/api", createRoutes());

app.use(ErrorHandler);
export { app };
