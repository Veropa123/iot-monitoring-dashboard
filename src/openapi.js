export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "IoT Monitoring Dashboard API",
    version: "0.1.0",
    description: "REST API for devices, telemetry readings, alerts, and operational summaries."
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "Service status" } }
      }
    },
    "/api/summary": {
      get: {
        summary: "Operational telemetry summary",
        responses: { "200": { description: "IoT KPI metrics" } }
      }
    },
    "/api/devices": {
      get: {
        summary: "Latest device states",
        responses: { "200": { description: "Device list" } }
      }
    },
    "/api/readings": {
      get: {
        summary: "Historical telemetry readings",
        responses: { "200": { description: "Telemetry history" } }
      }
    },
    "/api/alerts": {
      get: {
        summary: "Recent alerts",
        responses: { "200": { description: "Alert history" } }
      }
    },
    "/api/config": {
      get: {
        summary: "Public demo configuration",
        responses: { "200": { description: "Telemetry source and WebSocket path" } }
      }
    }
  }
};
