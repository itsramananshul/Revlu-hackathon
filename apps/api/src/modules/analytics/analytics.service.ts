import type { AnalyticsSummary, SymptomTrend } from "./analytics.types";
import { seedPatients, seedCheckIns, seedAlerts } from "../../data/seed";

export const analyticsService = {
  getSummary(): AnalyticsSummary {
    const totalPatients = seedPatients.length;
    const activePatients = seedPatients.filter((p) => p.status === "active").length;
    const flaggedPatients = seedPatients.filter((p) => p.status === "flagged").length;

    // Average dropout risk from all check-in analyses
    const dropoutRisks = seedCheckIns
      .map((c) => c.analysis?.dropoutRisk)
      .filter((r): r is number => r !== undefined);

    const averageDropoutRisk =
      dropoutRisks.length > 0
        ? Math.round(
            (dropoutRisks.reduce((sum, r) => sum + r, 0) / dropoutRisks.length) *
              100
          ) / 100
        : 0;

    const recentAlerts = seedAlerts.length;

    // Aggregate symptom trends across all check-ins
    const symptomMap = new Map<
      string,
      { date: string; avgSeverity: number }[]
    >();

    for (const checkIn of seedCheckIns) {
      if (!checkIn.analysis) continue;
      for (const symptom of checkIn.analysis.symptoms) {
        if (!symptomMap.has(symptom.name)) {
          symptomMap.set(symptom.name, []);
        }
        symptomMap.get(symptom.name)!.push({
          date: checkIn.timestamp,
          avgSeverity: symptom.severity,
        });
      }
    }

    const symptomTrends: SymptomTrend[] = Array.from(symptomMap.entries()).map(
      ([name, dataPoints]) => ({
        name,
        dataPoints: dataPoints.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      })
    );

    return {
      totalPatients,
      activePatients,
      flaggedPatients,
      averageDropoutRisk,
      recentAlerts,
      symptomTrends,
    };
  },
};
