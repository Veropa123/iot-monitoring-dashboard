export const config = {
  env: process.env.APP_ENV || "development",
  port: Number(process.env.PORT || 8000),
  demoMode: (process.env.DEMO_MODE || "true").toLowerCase() === "true",
  mqttUrl: process.env.MQTT_URL || "",
  mqttTopic: process.env.MQTT_TOPIC || "iot/+/telemetry",
  databaseUrl: process.env.DATABASE_URL || "",
  simulatorIntervalMs: Number(process.env.SIMULATOR_INTERVAL_MS || 2000)
};
