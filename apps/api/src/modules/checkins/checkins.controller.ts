import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../../shared/utils";
import { NotFoundError } from "../../shared/errors";
import * as service from "./checkins.service";
import type { CreateCheckInDto } from "./checkins.types";

export function list(_req: Request, res: Response): void {
  try {
    const checkIns = service.getAllCheckIns();
    sendSuccess(res, checkIns);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export function getById(req: Request, res: Response): void {
  try {
    const checkIn = service.getCheckInById(req.params.id);
    if (!checkIn) {
      throw new NotFoundError("CheckIn");
    }
    sendSuccess(res, checkIn);
  } catch (err) {
    if (err instanceof NotFoundError) {
      sendError(res, err.message, err.statusCode);
    } else {
      sendError(res, (err as Error).message);
    }
  }
}

export function getByPatientId(req: Request, res: Response): void {
  try {
    const checkIns = service.getCheckInsByPatientId(req.params.patientId);
    sendSuccess(res, checkIns);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}

export function create(req: Request, res: Response): void {
  try {
    const dto: CreateCheckInDto = req.body;
    const checkIn = service.createCheckIn(dto);
    sendSuccess(res, checkIn, "Check-in created", 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
}
