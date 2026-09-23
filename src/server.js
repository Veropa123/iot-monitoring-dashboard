import http from "node:http";

import { createApp } from "./app.js";
import { config } from "./config.js";
import { attachWebSocketHub } from "./realtime/ws-hub.js";
import { createStore } from "./store/index.js";
import { createMqttSubscriber } from "./telemetry/mqtt-client.js";
import { createSimulator } from "./telemetry/simulator.js";
import { createTelemetryService } from "./telemetry/service.js";

const store = createStore();

try {
  await store.init();

  const app = createApp(store);
  const server = http.createServer(app);
  const hub = attachWebSocketHub(server);
  const telemetry = createTelemetryService({ store, hub });

  let source;

  if (config.mqttUrl) {
    source = createMqttSubscriber({
      url: config.mqttUrl,
      topic: config.mqttTopic,
      onMessage: (payload) =>
        telemetry.processReading(payload).catch((error) => console.error("Telemetry error:", error)),
      onError: (error) => console.error("MQTT error:", error)
    });
  } else {
    source = createSimulator({
      intervalMs: config.simulatorIntervalMs,
      onReading: (payload) =>
        telemetry.processReading(payload).catch((error) => console.error("Telemetry error:", error))
    });
    source.start();
  }

  server.listen(config.port, "0.0.0.0", () => {
    console.log(`IoT Monitoring Dashboard running on http://0.0.0.0:${config.port}`);
  });

  const shutdown = () => {
    source?.stop?.();
    source?.close?.();
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} catch (error) {
  console.error("Failed to start IoT application:", error);
  process.exit(1);
}
