import type { Alert } from "@trialpulse/types";
import { seedAlerts } from "../../data/seed";

// In-memory store initialized from seed data
const alerts = new Map<string, Alert>(
  seedAlerts.map((alert) => [alert.id, alert])
);

export const alertsRepository = {
  findAll(): Alert[] {
    return Array.from(alerts.values());
  },

  findById(id: string): Alert | undefined {
    return alerts.get(id);
  },

  findByPatientId(patientId: string): Alert[] {
    return Array.from(alerts.values()).filter(
      (a) => a.patientId === patientId
    );
  },

  findUnacknowledged(): Alert[] {
    return Array.from(alerts.values()).filter((a) => !a.acknowledged);
  },

  create(alert: Alert): Alert {
    alerts.set(alert.id, alert);
    return alert;
  },

  acknowledge(id: string): Alert | undefined {
    const alert = alerts.get(id);
    if (alert) {
      alert.acknowledged = true;
    }
    return alert;
  },
};
