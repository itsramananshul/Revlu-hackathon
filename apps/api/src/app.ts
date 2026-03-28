import express from "express";
import cors from "cors";
import { errorHandler, requestLogger } from "./shared/middleware";

import patientRoutes from "./modules/patients/patients.routes";
import checkinRoutes from "./modules/checkins/checkins.routes";
import aiRoutes from "./modules/ai/ai.routes";
import alertRoutes from "./modules/alerts/alerts.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "trialpulse-api" });
});

// Module routes
app.use("/api/patients", patientRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error handling
app.use(errorHandler);

export default app;
