import { Router } from "express";
import { alertsController } from "./alerts.controller";

const router = Router();

router.get("/", alertsController.list);
router.get("/unacknowledged", alertsController.getUnacknowledged);
router.get("/:id", alertsController.getById);
router.get("/patient/:patientId", alertsController.getByPatientId);
router.patch("/:id/acknowledge", alertsController.acknowledge);

export default router;
