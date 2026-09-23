const kpiGrid = document.querySelector("#kpi-grid");
const deviceGrid = document.querySelector("#device-grid");
const alertsList = document.querySelector("#alerts-list");
const alertCount = document.querySelector("#alert-count");
const connectionPill = document.querySelector("#connection-pill");
const statusEl = document.querySelector("#status");
const canvas = document.querySelector("#telemetry-chart");
const legend = document.querySelector("#legend");
const ctx = canvas.getContext("2d");

const devices = new Map();
const series = new Map();
let alerts = [];
let socket;

const seriesStyles = {
  "line-01": "#536be8",
  "scale-01": "#12a594",
  "oven-01": "#d97706"
};

async function loadInitialData() {
  const [summaryResponse, devicesResponse, readingsResponse, alertsResponse] = await Promise.all([
    fetch("/api/summary"),
    fetch("/api/devices"),
    fetch("/api/readings?limit=90"),
    fetch("/api/alerts?limit=12")
  ]);

  if (![summaryResponse, devicesResponse, readingsResponse, alertsResponse].every((response) => response.ok)) {
    throw new Error("Could not load monitoring data.");
  }

  const summary = await summaryResponse.json();
  const deviceData = await devicesResponse.json();
  const readings = await readingsResponse.json();
  alerts = await alertsResponse.json();

  for (const device of deviceData) devices.set(device.id, device);

  for (const reading of readings.reverse()) {
    pushReading(reading, false);
  }

  renderSummary(summary);
  renderDevices();
  renderAlerts();
  drawChart();
}

function connectWebSocket() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(protocol + "//" + location.host + "/ws");

  socket.addEventListener("open", () => {
    connectionPill.textContent = "Live connection";
    connectionPill.className = "connection-pill live";
    statusEl.textContent = "Receiving real-time telemetry.";
  });

  socket.addEventListener("message", async (event) => {
    const message = JSON.parse(event.data);

    if (message.event === "telemetry") {
      pushReading(message.payload, true);
      await refreshSummary();
    }

    if (message.event === "alert") {
      alerts.unshift(message.payload);
      alerts = alerts.slice(0, 12);
      renderAlerts();
    }
  });

  socket.addEventListener("close", () => {
    connectionPill.textContent = "Reconnecting...";
    connectionPill.className = "connection-pill offline";
    statusEl.textContent = "Real-time channel disconnected. Retrying...";
    setTimeout(connectWebSocket, 1800);
  });

  socket.addEventListener("error", () => socket.close());
}

function pushReading(reading, render = true) {
  devices.set(reading.device_id, {
    id: reading.device_id,
    name: reading.device_name,
    last_seen: reading.timestamp,
    machine_state: reading.machine_state,
    temperature_c: reading.temperature_c,
    current_a: reading.current_a,
    weight_kg: reading.weight_kg
  });

  if (!series.has(reading.device_id)) series.set(reading.device_id, []);
  const values = series.get(reading.device_id);
  values.push({
    timestamp: reading.timestamp,
    temperature: reading.temperature_c
  });
  if (values.length > 30) values.splice(0, values.length - 30);

  if (render) {
    renderDevices();
    drawChart();
  }
}

async function refreshSummary() {
  const response = await fetch("/api/summary");
  if (response.ok) renderSummary(await response.json());
}

function renderSummary(summary) {
  const cards = [
    ["Connected devices", summary.total_devices],
    ["Running", summary.running_devices],
    ["Active alerts", summary.active_alerts],
    ["Average temp.", formatNumber(summary.average_temperature_c) + " °C"]
  ];

  kpiGrid.innerHTML = cards.map(([label, value]) =>
    '<article class="kpi-card"><span>' + escapeHtml(label) +
    '</span><strong>' + escapeHtml(String(value)) + "</strong></article>"
  ).join("");
}

function renderDevices() {
  const data = Array.from(devices.values());

  deviceGrid.innerHTML = data.map((device) =>
    '<article class="device-card">' +
      '<div class="device-head"><div><span class="device-id">' +
        escapeHtml(device.id) + '</span><h3>' + escapeHtml(device.name) +
      '</h3></div><span class="state ' + escapeHtml(device.machine_state) + '">' +
        escapeHtml(device.machine_state) + '</span></div>' +
      '<div class="metrics">' +
        metric("Temp.", formatNumber(device.temperature_c) + " °C") +
        metric("Current", formatNumber(device.current_a) + " A") +
        metric("Weight", formatNumber(device.weight_kg) + " kg") +
      "</div>" +
    "</article>"
  ).join("");
}

function metric(label, value) {
  return '<div class="metric"><span>' + escapeHtml(label) + '</span><strong>' +
    escapeHtml(value) + "</strong></div>";
}

function renderAlerts() {
  alertCount.textContent = alerts.length + (alerts.length === 1 ? " alert" : " alerts");

  if (!alerts.length) {
    alertsList.innerHTML = '<div class="empty-state">No alerts have been generated yet.</div>';
    return;
  }

  alertsList.innerHTML = alerts.map((alert) =>
    '<div class="alert ' + escapeHtml(alert.severity) + '">' +
      "<strong>" + escapeHtml(alert.severity.toUpperCase()) + " · " +
      escapeHtml(alert.device_id) + "</strong>" +
      "<span>" + escapeHtml(alert.message) + "<br>" +
      escapeHtml(new Date(alert.created_at).toLocaleTimeString()) + "</span>" +
    "</div>"
  ).join("");
}

function drawChart() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(rect.width, 300);
  const height = Math.max(rect.height, 220);

  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const allValues = Array.from(series.values()).flat().map((point) => point.temperature);
  if (!allValues.length) return;

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = Math.max(maxValue - minValue, 1);
  const padding = 28;

  ctx.strokeStyle = "#e7ebf2";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  for (const [deviceId, points] of series.entries()) {
    if (points.length < 2) continue;

    ctx.strokeStyle = seriesStyles[deviceId] || "#697386";
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    points.forEach((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((point.temperature - minValue) / range) * (height - padding * 2);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }

  legend.innerHTML = Array.from(series.keys()).map((deviceId) =>
    '<span class="legend-item" style="color:' + (seriesStyles[deviceId] || "#697386") + '">' +
      '<i class="legend-dot"></i>' + escapeHtml(deviceId) +
    "</span>"
  ).join("");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("resize", drawChart);

(async function boot() {
  try {
    await loadInitialData();
    statusEl.textContent = "Dashboard loaded. Connecting real-time channel...";
    connectWebSocket();
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add("error");
  }
})();
