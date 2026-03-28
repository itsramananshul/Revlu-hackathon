import type { CheckIn } from "@trialpulse/types";
import { seedCheckIns } from "../../data/seed";

const checkIns: Map<string, CheckIn> = new Map(
  seedCheckIns.map((c) => [c.id, c])
);

export function findAll(): CheckIn[] {
  return Array.from(checkIns.values());
}

export function findById(id: string): CheckIn | undefined {
  return checkIns.get(id);
}

export function findByPatientId(patientId: string): CheckIn[] {
  return Array.from(checkIns.values()).filter(
    (c) => c.patientId === patientId
  );
}

export function create(checkIn: CheckIn): CheckIn {
  checkIns.set(checkIn.id, checkIn);
  return checkIn;
}
