import { config } from "../config.js";
import { MemoryStore } from "./memory-store.js";
import { PostgresStore } from "./postgres-store.js";

export function createStore() {
  if (!config.demoMode && config.databaseUrl) {
    return new PostgresStore(config.databaseUrl);
  }
  return new MemoryStore();
}
