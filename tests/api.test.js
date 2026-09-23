import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createApp } from "../src/app.js";
import { MemoryStore } from "../src/store/memory-store.js";

test("GET /health reports service status", async () => {
  const response = await request(createApp(new MemoryStore())).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});

test("GET /api/summary returns zeroed metrics before telemetry", async () => {
  const response = await request(createApp(new MemoryStore())).get("/api/summary");

  assert.equal(response.status, 200);
  assert.equal(response.body.total_devices, 0);
  assert.equal(response.body.active_alerts, 0);
});
