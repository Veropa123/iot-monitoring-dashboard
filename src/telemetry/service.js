import { telemetrySchema } from "./schema.js";

function buildAlert(reading) {
  if (reading.machine_state === "warning") {
    return {
      device_id: reading.device_id,
      severity: "warning",
      message: `${reading.device_name} reported a warning machine state.`,
      active: true,
      created_at: reading.timestamp
    };
  }

  if (reading.device_id === "oven-01" && reading.temperature_c > 760) {
    return {
      device_id: reading.device_id,
      severity: "critical",
      message: `${reading.device_name} temperature exceeded 760 °C.`,
      active: true,
      created_at: reading.timestamp
    };
  }

  if (reading.current_a > 35) {
    return {
      device_id: reading.device_id,
      severity: "warning",
      message: `${reading.device_name} current exceeded the configured threshold.`,
      active: true,
      created_at: reading.timestamp
    };
  }

  return null;
}

export function createTelemetryService({ store, hub }) {
  async function processReading(input) {
    const reading = telemetrySchema.parse(input);

    await store.saveReading(reading);

    const alert = buildAlert(reading);
    if (alert) {
      await store.saveAlert(alert);
      hub.broadcast("alert", alert);
    }

    hub.broadcast("telemetry", reading);
    return reading;
  }

  return { processReading };
}
