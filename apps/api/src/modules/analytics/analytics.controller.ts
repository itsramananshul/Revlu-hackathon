import type { Request, Response } from "express";
import { analyticsService } from "./analytics.service";
import { sendSuccess } from "../../shared/utils";

export const analyticsController = {
  getSummary(_req: Request, res: Response): void {
    const summary = analyticsService.getSummary();
    sendSuccess(res, summary);
  },
};
