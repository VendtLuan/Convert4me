export type AgendaBlockMetadata = {
  appointmentDate: string;
  address: string;
  unit: string;
  provider: string;
  scheduleStart: string;
  scheduleEnd: string;
  scheduleId: string;
};

export type ScheduledPatientRow = AgendaBlockMetadata & {
  attendanceType: string;
  plan: string;
  insurance: string;
  procedure: string;
  phone: string;
  patient: string;
  medicalRecordId: string;
  appointmentTime: string;
};
