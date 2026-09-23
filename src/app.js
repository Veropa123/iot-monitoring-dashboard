import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(store) {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );
  app.use(express.json({ limit: "256kb" }));
  app.use(morgan(config.env === "test" ? "tiny" : "combined"));
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      environment: config.env,
      telemetry_source: config.mqttUrl ? "mqtt" : "simulator",
      storage: !config.demoMode && config.databaseUrl ? "postgresql" : "demo-memory"
    });
  });

  app.get("/api/summary", async (_req, res, next) => {
    try {
      res.json(await store.summary());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/devices", async (_req, res, next) => {
    try {
      res.json(await store.listDevices());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/readings", async (req, res, next) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
      res.json(await store.latestReadings(limit));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/alerts", async (req, res, next) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit || 25), 1), 100);
      res.json(await store.listAlerts(limit));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/config", (_req, res) => {
    res.json({
      telemetry_source: config.mqttUrl ? "mqtt" : "simulator",
      demo_mode: config.demoMode,
      websocket_path: "/ws"
    });
  });

  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Endpoint not found." });
    }
    return res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  });

  return app;
}
