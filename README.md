# IoT Monitoring Dashboard

A real-time IoT monitoring platform for device telemetry, machine state, alerts, historical readings, and live operational dashboards.

## Overview

This project demonstrates an end-to-end IoT software architecture:

```text
ESP32 / Industrial Device / Built-in Simulator
                    |
                    v
                   MQTT
                    |
                    v
             Node.js Ingestion
                    |
          +---------+---------+
          |                   |
          v                   v
     REST API            WebSocket
          |                   |
          +---------+---------+
                    |
                    v
             Web Dashboard
                    |
                    v
        Memory / PostgreSQL Store
```

The public portfolio deployment runs with a built-in device simulator so recruiters and clients can see live telemetry without requiring physical hardware or an external broker. The same ingestion layer can switch to a real MQTT broker by setting `MQTT_URL`.

## Features

- Real-time device telemetry
- Built-in industrial device simulator
- MQTT subscriber for physical/remote devices
- WebSocket live updates
- Device state cards
- Temperature, current, and weight measurements
- Machine-state monitoring
- Automatic alert generation
- Historical telemetry API
- Recent alerts API
- Operational KPI summary
- Responsive browser dashboard
- Live temperature visualization
- PostgreSQL-ready persistence
- Swagger/OpenAPI documentation
- Automated tests
- Docker and Docker Compose
- GitHub Actions CI
- Render deployment configuration

## Demo Devices

The public demo simulates three different operational devices:

| Device | Purpose | Telemetry |
| --- | --- | --- |
| `line-01` | Production line | Temperature, current, machine state |
| `scale-01` | Dynamic scale | Temperature, current, weight, machine state |
| `oven-01` | Heat-treatment oven | High-temperature telemetry, current, machine state |

The simulator exists only to make the portfolio project independently demonstrable. A real MQTT source can be enabled without changing the dashboard or processing service.

## Tech Stack

- JavaScript
- Node.js
- Express
- MQTT
- WebSockets
- Zod
- PostgreSQL / pg
- HTML/CSS/JavaScript
- Swagger / OpenAPI
- Node Test Runner
- Supertest
- Docker
- GitHub Actions

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service health and active telemetry source |
| GET | `/api/summary` | Operational telemetry KPIs |
| GET | `/api/devices` | Latest state for every device |
| GET | `/api/readings` | Recent telemetry history |
| GET | `/api/alerts` | Recent generated alerts |
| GET | `/api/config` | Public demo configuration |
| GET | `/docs` | Interactive Swagger/OpenAPI documentation |
| WS | `/ws` | Real-time telemetry and alert events |

## Project Structure

```text
iot-monitoring-dashboard/
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── db/
│   │   └── schema.sql
│   ├── realtime/
│   │   └── ws-hub.js
│   ├── store/
│   │   ├── index.js
│   │   ├── memory-store.js
│   │   └── postgres-store.js
│   ├── telemetry/
│   │   ├── mqtt-client.js
│   │   ├── schema.js
│   │   ├── service.js
│   │   └── simulator.js
│   ├── app.js
│   ├── config.js
│   ├── openapi.js
│   └── server.js
├── tests/
│   ├── api.test.js
│   └── telemetry.test.js
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── LICENSE
├── package.json
├── README.md
└── render.yaml
```

## Run Locally

Clone the repository:

```bash
git clone https://github.com/Veropa123/iot-monitoring-dashboard.git
cd iot-monitoring-dashboard
```

Install dependencies:

```bash
npm install
```

Copy the environment example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Start the application:

```bash
npm start
```

Open:

```text
Dashboard: http://127.0.0.1:8000
API docs:  http://127.0.0.1:8000/docs
```

## Demo Mode

The default setup uses:

```env
DEMO_MODE=true
SIMULATOR_INTERVAL_MS=2000
```

The application generates live telemetry every two seconds and streams it to connected browsers over WebSockets.

## Connect a Real MQTT Broker

Set:

```env
MQTT_URL=mqtt://your-broker:1883
MQTT_TOPIC=iot/+/telemetry
```

Expected JSON payload:

```json
{
  "device_id": "scale-01",
  "device_name": "Dynamic Scale 01",
  "temperature_c": 29.4,
  "current_a": 2.18,
  "weight_kg": 1.742,
  "machine_state": "running",
  "timestamp": "2026-09-23T18:00:00.000Z"
}
```

The payload is validated before it enters the telemetry pipeline.

## PostgreSQL Mode

For persistent telemetry:

```env
DEMO_MODE=false
DATABASE_URL=postgresql://user:password@host:5432/iot_monitoring
```

The application automatically creates the required tables and indexes from `src/db/schema.sql`.

## Docker

```bash
docker compose up --build
```

## Testing

```bash
npm test
```

Tests cover API health, empty-state summaries, telemetry persistence, broadcasts, and alert generation.

GitHub Actions runs the suite automatically on pushes to `main` and pull requests.

## Alert Logic

The demo generates alerts when:

- A device reports a `warning` machine state.
- The heat-treatment oven exceeds 760 °C.
- Current exceeds the configured demonstration threshold.

These thresholds are intentionally simple and exist to demonstrate event processing. Production thresholds should be configurable per device and process.

## Portfolio Purpose

This project is designed as an IoT software case study, not as a simulated hardware claim. It demonstrates how a software developer can connect edge telemetry to a backend, process and validate messages, persist data, generate events, expose REST endpoints, and deliver real-time updates to a browser.

## Status

**Functional first version — ready for public deployment.**

## License

MIT
