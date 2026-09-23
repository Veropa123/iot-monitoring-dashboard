import { WebSocketServer } from "ws";

export function attachWebSocketHub(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  function broadcast(event, payload) {
    const message = JSON.stringify({ event, payload });

    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  }

  wss.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        event: "connected",
        payload: { message: "Real-time telemetry channel connected." }
      })
    );
  });

  return { broadcast, wss };
}
