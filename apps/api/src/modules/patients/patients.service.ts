import type { Patient, PatientStatus } from "./patients.types";
import type { CheckIn } from "@trialpulse/types";
import { patientsRepository } from "./patients.repository";
import { NotFoundError } from "../../shared/errors";

export const patientsService = {
  getAllPatients(): Patient[] {
    return patientsRepository.findAll();
  },

  getPatientById(id: string): Patient {
    const patient = patientsRepository.findById(id);
    if (!patient) {
      throw new NotFoundError("Patient");
    }
    return patient;
  },

  getCheckInsForPatient(patientId: string): CheckIn[] {
    // Ensure the patient exists before returning check-ins
    const patient = patientsRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError("Patient");
    }
    return patientsRepository.findCheckInsByPatientId(patientId);
  },

  createPatient(patient: Patient): Patient {
    return patientsRepository.create(patient);
  },

  updatePatientStatus(id: string, status: PatientStatus): Patient {
    const patient = patientsRepository.updateStatus(id, status);
    if (!patient) {
      throw new NotFoundError("Patient");
    }
    return patient;
  },
};
