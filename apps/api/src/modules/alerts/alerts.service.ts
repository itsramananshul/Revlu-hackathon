import type { Alert } from "@trialpulse/types";
import { v4 as uuid } from "uuid";
import { alertsRepository } from "./alerts.repository";
import { NotFoundError } from "../../shared/errors";
import type { CreateAlertDto } from "./alerts.types";

export const alertsService = {
  getAllAlerts(): Alert[] {
    return alertsRepository.findAll();
  },

  getAlertById(id: string): Alert {
    const alert = alertsRepository.findById(id);
    if (!alert) {
      throw new NotFoundError("Alert");
    }
    return alert;
  },

  getAlertsByPatientId(patientId: string): Alert[] {
    return alertsRepository.findByPatientId(patientId);
  },

  getUnacknowledgedAlerts(): Alert[] {
    return alertsRepository.findUnacknowledged();
  },

  createAlert(dto: CreateAlertDto): Alert {
    const alert: Alert = {
      id: uuid(),
      patientId: dto.patientId,
      checkInId: dto.checkInId,
      type: dto.type,
      severity: dto.severity,
      message: dto.message,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
    return alertsRepository.create(alert);
  },

  acknowledgeAlert(id: string): Alert {
    const alert = alertsRepository.acknowledge(id);
    if (!alert) {
      throw new NotFoundError("Alert");
    }
    return alert;
  },
};
