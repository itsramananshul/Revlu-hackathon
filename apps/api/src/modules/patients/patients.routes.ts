import { Router } from "express";
import { patientsController } from "./patients.controller";

const router = Router();

router.get("/", patientsController.getAll);
router.get("/:id", patientsController.getById);
router.get("/:id/checkins", patientsController.getCheckIns);

export default router;
