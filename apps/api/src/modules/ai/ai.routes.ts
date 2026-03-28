import { Router } from "express";
import { analyzeTranscript, generateSpeech, getProviderStatus } from "./ai.controller";

const router = Router();

router.post("/analyze", analyzeTranscript);
router.post("/speech", generateSpeech);
router.get("/status", getProviderStatus);

export default router;
