import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.API_PORT || 4000;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║       TrialPulse API Server          ║
  ║       http://localhost:${PORT}          ║
  ╚══════════════════════════════════════╝
  `);
});
