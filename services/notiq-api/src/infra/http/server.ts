import express from "express";
import { ErrorHandler, NotFoundHandler } from "./middleware/error-handler";
import { createRoutes } from "./routes";

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/v1/api", createRoutes());

app.use(NotFoundHandler);
app.use(ErrorHandler);

export { app };
