import assert from "node:assert/strict";
import test from "node:test";

import { MemoryStore } from "../src/store/memory-store.js";
import { createTelemetryService } from "../src/telemetry/service.js";

function reading(overrides = {}) {
  return {
    device_id: "line-01",
    device_name: "Production Line 01",
    temperature_c: 62.1,
    current_a: 8.2,
    weight_kg: 0,
    machine_state: "running",
    timestamp: "2026-09-23T18:00:00.000Z",
    ...overrides
  };
}

test("telemetry service stores and broadcasts readings", async () => {
  const store = new MemoryStore();
  const events = [];
  const service = createTelemetryService({
    store,
    hub: { broadcast: (event, payload) => events.push({ event, payload }) }
  });

  await service.processReading(reading());

  const devices = await store.listDevices();
  assert.equal(devices.length, 1);
  assert.equal(devices[0].id, "line-01");
  assert.equal(events[0].event, "telemetry");
});

test("warning state creates an alert", async () => {
  const store = new MemoryStore();
  const events = [];
  const service = createTelemetryService({
    store,
    hub: { broadcast: (event, payload) => events.push({ event, payload }) }
  });

  await service.processReading(reading({ machine_state: "warning" }));

  const alerts = await store.listAlerts();
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].severity, "warning");
  assert.equal(events.some((item) => item.event === "alert"), true);
});
