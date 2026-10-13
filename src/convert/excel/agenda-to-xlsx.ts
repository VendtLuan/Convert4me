import ExcelJS from 'exceljs';
import type { ScheduledPatientRow } from '../types/scheduled-patient-row';

const DATE_FMT = 'dd/mm/yyyy';
const TIME_FMT = 'hh:mm';

function parseBrazilianDateString(value: string): Date {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function parseTimeString(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  return new Date(Date.UTC(1899, 11, 30, hours, minutes));
}

const HEADERS = [
  'Date',
  'Provider',
  'ScheduleStart',
  'ScheduleEnd',
  'ScheduleId',
  'AppointmentTime',
  'MedicalRecordId',
  'Patient',
  'Phone',
  'Procedure',
  'Insurance',
  'PlanType',
] as const;

export async function rowsToXlsxBuffer(
  rows: ScheduledPatientRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Appointments');

  sheet.addRow([...HEADERS]);
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    const excelRow = sheet.addRow([
      parseBrazilianDateString(row.appointmentDate),
      row.provider,
      parseTimeString(row.scheduleStart),
      parseTimeString(row.scheduleEnd),
      row.scheduleId,
      parseTimeString(row.appointmentTime),
      row.medicalRecordId,
      row.patient,
      row.phone,
      row.procedure,
      row.insurance,
      row.planType,
    ]);

    excelRow.getCell(1).numFmt = DATE_FMT;
    excelRow.getCell(3).numFmt = TIME_FMT;
    excelRow.getCell(4).numFmt = TIME_FMT;
    excelRow.getCell(6).numFmt = TIME_FMT;
  }

  sheet.autoFilter = {
    from: 'A1',
    to: `L${Math.max(1, rows.length + 1)}`,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
