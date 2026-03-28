import type { Request, Response } from "express";
import { alertsService } from "./alerts.service";
import { sendSuccess, sendError } from "../../shared/utils";
import { AppError } from "../../shared/errors";

export const alertsController = {
  list(_req: Request, res: Response): void {
    try {
      const alerts = alertsService.getAllAlerts();
      sendSuccess(res, alerts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      sendError(res, message);
    }
  },

  getById(req: Request, res: Response): void {
    try {
      const alert = alertsService.getAlertById(req.params.id);
      sendSuccess(res, alert);
    } catch (err) {
      if (err instanceof AppError) {
        sendError(res, err.message, err.statusCode);
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        sendError(res, message);
      }
    }
  },

  getByPatientId(req: Request, res: Response): void {
    try {
      const alerts = alertsService.getAlertsByPatientId(req.params.patientId);
      sendSuccess(res, alerts);
    } catch (err) {
      if (err instanceof AppError) {
        sendError(res, err.message, err.statusCode);
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        sendError(res, message);
      }
    }
  },

  getUnacknowledged(_req: Request, res: Response): void {
    try {
      const alerts = alertsService.getUnacknowledgedAlerts();
      sendSuccess(res, alerts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      sendError(res, message);
    }
  },

  acknowledge(req: Request, res: Response): void {
    try {
      const alert = alertsService.acknowledgeAlert(req.params.id);
      sendSuccess(res, alert);
    } catch (err) {
      if (err instanceof AppError) {
        sendError(res, err.message, err.statusCode);
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        sendError(res, message);
      }
    }
  },
};
