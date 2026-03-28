import type { Patient, PatientStatus } from "./patients.types";
import { seedPatients, seedCheckIns } from "../../data/seed";
import type { CheckIn } from "@trialpulse/types";

// In-memory store initialized from seed data
const patients: Patient[] = [...seedPatients];

export const patientsRepository = {
  findAll(): Patient[] {
    return patients;
  },

  findById(id: string): Patient | undefined {
    return patients.find((p) => p.id === id);
  },

  create(patient: Patient): Patient {
    patients.push(patient);
    return patient;
  },

  updateStatus(id: string, status: PatientStatus): Patient | undefined {
    const patient = patients.find((p) => p.id === id);
    if (patient) {
      patient.status = status;
    }
    return patient;
  },

  findCheckInsByPatientId(patientId: string): CheckIn[] {
    return seedCheckIns.filter((c) => c.patientId === patientId);
  },
};
