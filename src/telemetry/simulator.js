const devices = [
  { id: "line-01", name: "Production Line 01", temp: 62, current: 8.4, weight: 0 },
  { id: "scale-01", name: "Dynamic Scale 01", temp: 29, current: 2.2, weight: 1.75 },
  { id: "oven-01", name: "Heat Treatment Oven", temp: 735, current: 32.5, weight: 0 }
];

function jitter(value, magnitude) {
  return value + (Math.random() - 0.5) * magnitude * 2;
}

function stateFor(deviceId) {
  const roll = Math.random();
  if (deviceId === "oven-01" && roll > 0.90) return "warning";
  if (roll > 0.96) return "warning";
  if (roll > 0.90) return "idle";
  return "running";
}

export function createSimulator({ intervalMs, onReading }) {
  let timer = null;

  function generate() {
    for (const device of devices) {
      const state = stateFor(device.id);
      const reading = {
        device_id: device.id,
        device_name: device.name,
        temperature_c: Number(jitter(device.temp, device.id === "oven-01" ? 18 : 2.5).toFixed(1)),
        current_a: Number(jitter(device.current, Math.max(0.25, device.current * 0.08)).toFixed(2)),
        weight_kg: Number(
          (device.id === "scale-01" ? Math.max(0, jitter(device.weight, 0.35)) : 0).toFixed(3)
        ),
        machine_state: state,
        timestamp: new Date().toISOString()
      };
      onReading(reading);
    }
  }

  return {
    start() {
      if (timer) return;
      generate();
      timer = setInterval(generate, intervalMs);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
  };
}
