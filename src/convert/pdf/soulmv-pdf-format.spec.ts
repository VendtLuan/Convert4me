import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import {
  isSoulmvAgendaPdfFormat,
  validateSoulmvAgendaPdfFormat,
} from './soulmv-pdf-format';
import * as pdfModule from './extract-text-from-pdf';

const samplePdfPath = join(
  __dirname,
  '../../../test/fixtures/soulmv-agenda.sample.pdf',
);

describe('soulmv-pdf-format', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validateSoulmvAgendaPdfFormat accepts sample SOULMV PDF', async () => {
    const buffer = readFileSync(samplePdfPath);

    await expect(validateSoulmvAgendaPdfFormat(buffer)).resolves.toBeUndefined();
  });

  it('validateSoulmvAgendaPdfFormat rejects unrelated PDF text', async () => {
    jest
      .spyOn(pdfModule, 'extractTextFromPdf')
      .mockResolvedValue('generic invoice');

    await expect(
      validateSoulmvAgendaPdfFormat(Buffer.from('%PDF')),
    ).rejects.toThrow(BadRequestException);
  });

  it('isSoulmvAgendaPdfFormat returns false for invalid layout', async () => {
    jest.spyOn(pdfModule, 'extractTextFromPdf').mockResolvedValue('other');

    await expect(isSoulmvAgendaPdfFormat(Buffer.from('%PDF'))).resolves.toBe(
      false,
    );
  });
});
