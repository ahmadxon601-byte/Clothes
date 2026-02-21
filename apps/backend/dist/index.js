"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = void 0;
const fastify_1 = __importDefault(require("fastify"));
const sensible_1 = __importDefault(require("@fastify/sensible"));
const cors_1 = __importDefault(require("@fastify/cors"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const config_1 = require("./config");
const telegram_1 = __importDefault(require("./telegram"));
const buildServer = () => {
    const app = (0, fastify_1.default)({ logger: true });
    app.register(cors_1.default, { origin: config_1.config.corsOrigins });
    app.register(sensible_1.default);
    app.register(swagger_1.default, {
        openapi: {
            info: {
                title: "Clothes Marketplace API",
                version: "0.1.0"
            }
        }
    });
    app.register(swagger_ui_1.default, {
        routePrefix: "/docs"
    });
    app.get("/health", async () => ({
        status: "ok",
        time: new Date().toISOString(),
        env: process.env.NODE_ENV
    }));
    app.register(telegram_1.default);
    return app;
};
exports.buildServer = buildServer;
// For Vercel Serverless Functions
const server = buildServer();
exports.default = async (req, res) => {
    await server.ready();
    server.server.emit('request', req, res);
};
