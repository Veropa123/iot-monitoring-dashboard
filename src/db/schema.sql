CREATE TABLE IF NOT EXISTS telemetry_readings (
  id BIGSERIAL PRIMARY KEY,
  device_id VARCHAR(80) NOT NULL,
  device_name VARCHAR(120) NOT NULL,
  temperature_c NUMERIC(10, 2) NOT NULL,
  current_a NUMERIC(10, 3) NOT NULL,
  weight_kg NUMERIC(12, 3) NOT NULL,
  machine_state VARCHAR(30) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_device_time
  ON telemetry_readings(device_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS telemetry_alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id VARCHAR(80) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at
  ON telemetry_alerts(created_at DESC);
