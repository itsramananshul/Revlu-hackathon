import { Router } from "express";
import * as controller from "./checkins.controller";

const router = Router();

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.get("/patient/:patientId", controller.getByPatientId);
router.post("/", controller.create);

export default router;
