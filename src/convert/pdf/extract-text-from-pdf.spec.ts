import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertSoulmvAgendaLayout,
  extractTextFromPdf,
} from './extract-text-from-pdf';

const samplePdfPath = join(
  __dirname,
  '../../../test/fixtures/soulmv-agenda.sample.pdf',
);

describe('extractTextFromPdf', () => {
  it('extracts text from a sample SOULMV PDF', async () => {
    const buffer = readFileSync(samplePdfPath);
    const text = await extractTextFromPdf(buffer);

    expect(text).toContain('Lista de Pacientes Agendados');
    expect(text).toContain('07/10/2026');
  });
});

describe('assertSoulmvAgendaLayout', () => {
  it('passes when scheduled patient list marker is present', () => {
    expect(() =>
      assertSoulmvAgendaLayout('header\nLista de Pacientes Agendados\n'),
    ).not.toThrow();
  });

  it('throws when marker is missing', () => {
    expect(() => assertSoulmvAgendaLayout('generic pdf text')).toThrow(
      'Unrecognized SOULMV layout: scheduled patient list not found.',
    );
  });
});
