import Fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { config } from "./config";
import telegramWebhook from "./telegram";

const buildServer = () => {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: config.corsOrigins });
  app.register(sensible);

  app.register(swagger, {
    openapi: {
      info: {
        title: "Clothes Marketplace API",
        version: "0.1.0"
      }
    }
  });
  app.register(swaggerUI, {
    routePrefix: "/docs"
  });

  app.get("/health", async () => ({
    status: "ok",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV
  }));
  app.register(telegramWebhook);

  return app;
};

const app = buildServer();

// Start server if run directly (local development)
// In ts-node-dev/ts-node, require.main might be different,
// so we also check NODE_ENV or use a more robust check if needed.
if (require.main === module || process.env.NODE_ENV === "development") {
  const start = async () => {
    try {
      await app.listen({ port: config.port, host: config.host });
      console.log(`🚀 Server listening on http://${config.host}:${config.port}`);
      console.log(`📡 Health check: http://localhost:${config.port}/health`);

      // If we are local, and we have a telegram plugin, we might want to trigger something
      // But usually bot.start() is handled in the plugin or here.
      // Let's check if the telegram bot should start polling.
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}

export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};

export { buildServer, app };
