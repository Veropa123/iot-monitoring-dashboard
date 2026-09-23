export class MemoryStore {
  constructor() {
    this.devices = new Map();
    this.readings = [];
    this.alerts = [];
    this.maxReadings = 500;
  }

  async init() {}

  async saveReading(reading) {
    this.devices.set(reading.device_id, {
      id: reading.device_id,
      name: reading.device_name,
      last_seen: reading.timestamp,
      machine_state: reading.machine_state,
      temperature_c: reading.temperature_c,
      current_a: reading.current_a,
      weight_kg: reading.weight_kg
    });

    this.readings.push(reading);
    if (this.readings.length > this.maxReadings) {
      this.readings.splice(0, this.readings.length - this.maxReadings);
    }
  }

  async saveAlert(alert) {
    this.alerts.unshift(alert);
    this.alerts = this.alerts.slice(0, 100);
  }

  async listDevices() {
    return Array.from(this.devices.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  async latestReadings(limit = 50) {
    return this.readings.slice(-limit).reverse();
  }

  async listAlerts(limit = 25) {
    return this.alerts.slice(0, limit);
  }

  async summary() {
    const devices = await this.listDevices();
    const activeAlerts = this.alerts.filter((alert) => alert.active);

    return {
      total_devices: devices.length,
      running_devices: devices.filter((device) => device.machine_state === "running").length,
      warning_devices: devices.filter((device) => device.machine_state === "warning").length,
      active_alerts: activeAlerts.length,
      average_temperature_c: devices.length
        ? Number((devices.reduce((sum, device) => sum + device.temperature_c, 0) / devices.length).toFixed(1))
        : 0,
      average_current_a: devices.length
        ? Number((devices.reduce((sum, device) => sum + device.current_a, 0) / devices.length).toFixed(2))
        : 0
    };
  }
}
