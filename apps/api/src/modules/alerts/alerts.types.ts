export interface CreateAlertDto {
  patientId: string;
  checkInId: string;
  type: import("@trialpulse/types").AlertType;
  severity: import("@trialpulse/types").AlertSeverity;
  message: string;
}
