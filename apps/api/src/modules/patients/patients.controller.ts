import type { Request, Response } from "express";
import { patientsService } from "./patients.service";
import { sendSuccess, sendError } from "../../shared/utils";
import { AppError } from "../../shared/errors";

export const patientsController = {
  getAll(_req: Request, res: Response): void {
    try {
      const patients = patientsService.getAllPatients();
      sendSuccess(res, patients);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      sendError(res, message);
    }
  },

  getById(req: Request, res: Response): void {
    try {
      const patient = patientsService.getPatientById(req.params.id);
      sendSuccess(res, patient);
    } catch (err) {
      if (err instanceof AppError) {
        sendError(res, err.message, err.statusCode);
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        sendError(res, message);
      }
    }
  },

  getCheckIns(req: Request, res: Response): void {
    try {
      const checkIns = patientsService.getCheckInsForPatient(req.params.id);
      sendSuccess(res, checkIns);
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
