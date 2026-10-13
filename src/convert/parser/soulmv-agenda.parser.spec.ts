import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSoulmvAgendaText } from './soulmv-agenda.parser';

const fixturePath = join(
  __dirname,
  '../../../test/fixtures/soulmv-agenda.sample.txt',
);

describe('parseSoulmvAgendaText', () => {
  it('parses 48 patients across 3 appointment dates', () => {
    const text = readFileSync(fixturePath, 'utf8');
    const rows = parseSoulmvAgendaText(text);

    expect(rows).toHaveLength(48);

    const dates = [...new Set(rows.map((r) => r.appointmentDate))].sort();
    expect(dates).toEqual(['07/10/2026', '14/10/2026', '21/10/2026']);

    expect(rows[0]).toMatchObject({
      appointmentDate: '07/10/2026',
      address: 'RUA GUILHERME MARCONI, 440',
      unit: 'AMBULATORIO CLINICA E DIAG',
      provider: 'ANNA LUIZA SCALON PRATES',
      scheduleStart: '07:00',
      scheduleEnd: '11:30',
      scheduleId: '2134927',
      patient: 'KAMILLY VICTORIA RAMALHO LIRA',
      medicalRecordId: '2308968',
      appointmentTime: '07:00',
    });
  });

  it('returns no rows for empty text', () => {
    expect(parseSoulmvAgendaText('')).toEqual([]);
  });

  it('leaves phone empty when missing from the PDF row', () => {
    const text = readFileSync(fixturePath, 'utf8');
    const rows = parseSoulmvAgendaText(text);
    const withoutPhone = rows.find((r) => r.patient.includes('JANAINA DUCA'));

    expect(withoutPhone?.phone).toBe('');
    expect(withoutPhone?.medicalRecordId).toBe('28346433');
  });
});
