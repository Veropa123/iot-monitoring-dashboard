import { z } from "zod";

export const telemetrySchema = z.object({
  device_id: z.string().min(2).max(80),
  device_name: z.string().min(2).max(120),
  temperature_c: z.number().min(-100).max(1500),
  current_a: z.number().min(0).max(5000),
  weight_kg: z.number().min(0).max(100000),
  machine_state: z.enum(["running", "idle", "warning", "stopped"]),
  timestamp: z.string().datetime()
});
