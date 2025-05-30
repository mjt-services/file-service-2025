import { Hono } from "hono";
import { cors } from "hono/cors";

import { logger } from "hono/logger";
import type { Env } from "./Env";
import { fileRoute } from "./route/fileRoute";

export const createApp = () => {
  const app = new Hono<{ Bindings: Env }>();

  app.use("*", logger());

  app.use(
    "*",
    cors({
      origin: "*",
      allowHeaders: ["*"],
      allowMethods: ["*"],
      maxAge: 3600,
    })
  );

  app.get("/", (c) => c.text("File service running"));

  fileRoute(app);

  return app;
};
