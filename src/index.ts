import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bearerAuth } from "hono/bearer-auth";
import { createMcpHandler } from "agents/mcp";
import { timingSafeEqual, type Env } from "./lib/env.js";
import { createMcpServer } from "./mcp-server.js";
import { api } from "./routes/api.js";

type HonoEnv = { Bindings: Env };

const app = new Hono<HonoEnv>();

app.use(logger());

// --- Shared auth middleware for /mcp and /api/* ---
const authTokenCheck = async (c: { env: Env; json: (data: unknown, status: number) => Response }, next: () => Promise<void>) => {
  if (!c.env.AUTH_TOKEN) {
    return c.json(
      { error: "Server misconfiguration: no authentication method is enabled" },
      503,
    );
  }
  return next();
};

app.use("/mcp", cors());
app.use("/mcp", authTokenCheck);
app.use(
  "/mcp",
  bearerAuth({
    verifyToken: async (token, c) => timingSafeEqual(token, c.env.AUTH_TOKEN),
  }),
);

app.all("/mcp", async (c) => {
  const server = createMcpServer(c.env);
  const handler = createMcpHandler(server);
  return handler(c.req.raw, c.env, c.executionCtx);
});

// --- REST API ---
app.use("/api/*", cors());
app.use("/api/*", authTokenCheck);
app.use(
  "/api/*",
  bearerAuth({
    verifyToken: async (token, c) => timingSafeEqual(token, c.env.AUTH_TOKEN),
  }),
);

app.route("/api", api);

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
