import ExcelJS from 'exceljs';
import type { ScheduledPatientRow } from '../types/scheduled-patient-row';

const DATE_FMT = 'dd/mm/yyyy';
const TIME_FMT = 'hh:mm';

function parseBrDate(value: string): Date {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function parseTime(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  return new Date(Date.UTC(1899, 11, 30, hours, minutes));
}

const HEADERS = [
  'Data',
  'Endereco',
  'Unidade',
  'Prestador',
  'FuncionamentoInicio',
  'FuncionamentoFim',
  'Agenda',
  'Hora',
  'Matricula',
  'Paciente',
  'Telefone',
  'Procedimento',
  'Convenio',
  'TpAtendPlano',
] as const;

export async function rowsToXlsxBuffer(
  rows: ScheduledPatientRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Agendamentos');

  sheet.addRow([...HEADERS]);
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    const excelRow = sheet.addRow([
      parseBrDate(row.data),
      row.endereco,
      row.unidade,
      row.prestador,
      parseTime(row.funcionamentoInicio),
      parseTime(row.funcionamentoFim),
      row.agenda,
      parseTime(row.hora),
      row.matricula,
      row.paciente,
      row.telefone,
      row.procedimento,
      row.convenio,
      row.tpAtendPlano,
    ]);

    excelRow.getCell(1).numFmt = DATE_FMT;
    excelRow.getCell(5).numFmt = TIME_FMT;
    excelRow.getCell(6).numFmt = TIME_FMT;
    excelRow.getCell(8).numFmt = TIME_FMT;
  }

  sheet.autoFilter = {
    from: 'A1',
    to: `N${Math.max(1, rows.length + 1)}`,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
