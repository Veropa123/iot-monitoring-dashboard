import mqtt from "mqtt";

export function createMqttSubscriber({ url, topic, onMessage, onError }) {
  const client = mqtt.connect(url);

  client.on("connect", () => {
    client.subscribe(topic, (error) => {
      if (error) onError(error);
    });
  });

  client.on("message", (_topic, payload) => {
    try {
      const parsed = JSON.parse(payload.toString("utf8"));
      onMessage(parsed);
    } catch (error) {
      onError(error);
    }
  });

  client.on("error", onError);

  return {
    close() {
      client.end(true);
    }
  };
}
