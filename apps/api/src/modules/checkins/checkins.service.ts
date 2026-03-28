import { v4 as uuidv4 } from "uuid";
import type { CheckIn } from "@trialpulse/types";
import type { CreateCheckInDto } from "./checkins.types";
import * as repo from "./checkins.repository";

export function getAllCheckIns(): CheckIn[] {
  return repo.findAll();
}

export function getCheckInById(id: string): CheckIn | undefined {
  return repo.findById(id);
}

export function getCheckInsByPatientId(patientId: string): CheckIn[] {
  return repo.findByPatientId(patientId);
}

export function createCheckIn(dto: CreateCheckInDto): CheckIn {
  const checkIn: CheckIn = {
    id: uuidv4(),
    patientId: dto.patientId,
    timestamp: new Date().toISOString(),
    transcript: dto.transcript,
    audioUrl: dto.audioUrl,
  };

  return repo.create(checkIn);
}
