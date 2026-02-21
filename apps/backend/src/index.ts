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

export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};

export { buildServer, app };
