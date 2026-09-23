import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PostgresStore {
  constructor(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false }
    });
  }

  async init() {
    const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
    const schema = await fs.readFile(schemaPath, "utf8");
    await this.pool.query(schema);
  }

  async saveReading(reading) {
    await this.pool.query(
      `INSERT INTO telemetry_readings
        (device_id, device_name, temperature_c, current_a, weight_kg, machine_state, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        reading.device_id,
        reading.device_name,
        reading.temperature_c,
        reading.current_a,
        reading.weight_kg,
        reading.machine_state,
        reading.timestamp
      ]
    );
  }

  async saveAlert(alert) {
    await this.pool.query(
      `INSERT INTO telemetry_alerts
        (device_id, severity, message, active, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [alert.device_id, alert.severity, alert.message, alert.active, alert.created_at]
    );
  }

  async listDevices() {
    const { rows } = await this.pool.query(`
      SELECT DISTINCT ON (device_id)
        device_id AS id,
        device_name AS name,
        recorded_at AS last_seen,
        machine_state,
        temperature_c,
        current_a,
        weight_kg
      FROM telemetry_readings
      ORDER BY device_id, recorded_at DESC
    `);
    return rows;
  }

  async latestReadings(limit = 50) {
    const { rows } = await this.pool.query(
      `SELECT
        device_id,
        device_name,
        temperature_c::float8,
        current_a::float8,
        weight_kg::float8,
        machine_state,
        recorded_at AS timestamp
       FROM telemetry_readings
       ORDER BY recorded_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }

  async listAlerts(limit = 25) {
    const { rows } = await this.pool.query(
      `SELECT
        id,
        device_id,
        severity,
        message,
        active,
        created_at
       FROM telemetry_alerts
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }

  async summary() {
    const { rows } = await this.pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (device_id)
          device_id,
          machine_state,
          temperature_c,
          current_a
        FROM telemetry_readings
        ORDER BY device_id, recorded_at DESC
      )
      SELECT
        COUNT(*)::int AS total_devices,
        COUNT(*) FILTER (WHERE machine_state = 'running')::int AS running_devices,
        COUNT(*) FILTER (WHERE machine_state = 'warning')::int AS warning_devices,
        COALESCE(ROUND(AVG(temperature_c), 1), 0)::float8 AS average_temperature_c,
        COALESCE(ROUND(AVG(current_a), 2), 0)::float8 AS average_current_a
      FROM latest
    `);

    const alertResult = await this.pool.query(
      "SELECT COUNT(*)::int AS active_alerts FROM telemetry_alerts WHERE active = true"
    );

    return {
      ...rows[0],
      active_alerts: alertResult.rows[0].active_alerts
    };
  }
}
