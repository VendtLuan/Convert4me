import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { parseSoulmvAgendaText } from '../parser/soulmv-agenda.parser';
import { rowsToXlsxBuffer } from './agenda-to-xlsx';

const fixturePath = join(
  __dirname,
  '../../../test/fixtures/soulmv-agenda.sample.txt',
);

async function loadWorkbook(data: Uint8Array): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(Readable.from(data));
  return workbook;
}

describe('rowsToXlsxBuffer', () => {
  it('builds a workbook with headers and patient rows', async () => {
    const rows = parseSoulmvAgendaText(readFileSync(fixturePath, 'utf8'));
    const buffer = await rowsToXlsxBuffer(rows);

    const workbook = await loadWorkbook(buffer);

    const sheet = workbook.getWorksheet('Appointments');
    expect(sheet).toBeDefined();
    expect(sheet?.rowCount).toBe(rows.length + 1);

    const headerRow = sheet?.getRow(1);
    expect(headerRow?.getCell(1).value).toBe('Date');
    expect(headerRow?.getCell(8).value).toBe('Patient');
    expect(headerRow?.getCell(12).value).toBe('PlanType');
    expect(headerRow?.font?.bold).toBe(true);

    const firstDataRow = sheet?.getRow(2);
    expect(firstDataRow?.getCell(8).value).toBe(
      'KAMILLY VICTORIA RAMALHO LIRA',
    );
    expect(firstDataRow?.getCell(1).numFmt).toBe('dd/mm/yyyy');
    expect(firstDataRow?.getCell(6).numFmt).toBe('hh:mm');
  });

  it('supports an empty patient list with header only', async () => {
    const buffer = await rowsToXlsxBuffer([]);
    const workbook = await loadWorkbook(buffer);

    const sheet = workbook.getWorksheet('Appointments');
    expect(sheet?.rowCount).toBe(1);
    expect(sheet?.getRow(1).getCell(1).value).toBe('Date');
  });
});
