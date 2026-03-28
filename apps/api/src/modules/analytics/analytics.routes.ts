import { Router } from "express";
import { analyticsController } from "./analytics.controller";

const router = Router();

router.get("/summary", analyticsController.getSummary);

export default router;
