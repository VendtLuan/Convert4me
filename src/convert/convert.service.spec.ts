import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConvertService } from './convert.service';
import * as excelModule from './excel/agenda-to-xlsx';
import * as parserModule from './parser/soulmv-agenda.parser';
import * as pdfModule from './pdf/extract-text-from-pdf';
import { createMulterFile } from './testing/multer-file.fixture';

const samplePdfPath = join(
  __dirname,
  '../../test/fixtures/soulmv-agenda.sample.pdf',
);

describe('ConvertService', () => {
  let service: ConvertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConvertService],
    }).compile();

    service = module.get(ConvertService);
    jest.restoreAllMocks();
  });

  describe('convert', () => {
    it('returns an xlsx buffer and filename for a valid SOULMV PDF', async () => {
      const buffer = readFileSync(samplePdfPath);
      const result = await service.convert(
        createMulterFile({ buffer, originalname: 'agenda.pdf' }),
      );

      expect(result.filename).toBe('agenda.xlsx');
      expect(result.buffer.subarray(0, 2).toString('utf8')).toBe('PK');
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('uses scheduled-patients when originalname is empty after stripping pdf', async () => {
      const buffer = readFileSync(samplePdfPath);
      const result = await service.convert(
        createMulterFile({ buffer, originalname: '.pdf' }),
      );

      expect(result.filename).toBe('scheduled-patients.xlsx');
    });

    it('throws when file is missing or buffer is empty', async () => {
      await expect(
        service.convert(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(
        new BadRequestException('File was not sent or is empty.'),
      );

      await expect(
        service.convert(createMulterFile({ buffer: Buffer.alloc(0) })),
      ).rejects.toThrow(
        new BadRequestException('File was not sent or is empty.'),
      );
    });

    it('throws when upload is not a PDF', async () => {
      await expect(
        service.convert(
          createMulterFile({
            buffer: Buffer.from('not-a-pdf'),
            mimetype: 'text/plain',
            originalname: 'notes.txt',
          }),
        ),
      ).rejects.toThrow(new BadRequestException('Upload a PDF file.'));
    });

    it('accepts PDF by extension when mimetype is generic', async () => {
      const buffer = readFileSync(samplePdfPath);
      const result = await service.convert(
        createMulterFile({
          buffer,
          mimetype: 'application/octet-stream',
          originalname: 'report.pdf',
        }),
      );

      expect(result.filename).toBe('report.xlsx');
    });

    it('throws when PDF text cannot be extracted', async () => {
      jest
        .spyOn(pdfModule, 'extractTextFromPdf')
        .mockRejectedValue(new Error('parse failed'));

      await expect(
        service.convert(createMulterFile({ buffer: Buffer.from('%PDF-fake') })),
      ).rejects.toThrow(new BadRequestException('Could not read the PDF.'));
    });

    it('throws when SOULMV layout is not recognized', async () => {
      jest
        .spyOn(pdfModule, 'extractTextFromPdf')
        .mockResolvedValue('unrelated document');

      await expect(
        service.convert(createMulterFile({ buffer: Buffer.from('%PDF') })),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when no patient rows are parsed', async () => {
      jest.spyOn(pdfModule, 'extractTextFromPdf').mockResolvedValue(`
Lista de Pacientes Agendados
07/10/2026\tData:
RUA X\tUNIT
DOCTOR
11:30\t07:00
123
Tp. Atend. Plano\tConvênio\tProcedimento\tTelefone\tPaciente\tMatricula\tHora
`);

      await expect(
        service.convert(createMulterFile({ buffer: Buffer.from('%PDF') })),
      ).rejects.toThrow(
        new BadRequestException(
          'No patients found in the PDF. Check the report layout.',
        ),
      );
    });

    it('throws when xlsx generation fails', async () => {
      const buffer = readFileSync(samplePdfPath);
      jest
        .spyOn(excelModule, 'rowsToXlsxBuffer')
        .mockRejectedValue(new Error('excel failed'));

      await expect(
        service.convert(createMulterFile({ buffer })),
      ).rejects.toThrow('excel failed');
    });

    it('delegates parsed rows to xlsx export', async () => {
      const buffer = readFileSync(samplePdfPath);
      const rowsSpy = jest.spyOn(parserModule, 'parseSoulmvAgendaText');
      const xlsxSpy = jest.spyOn(excelModule, 'rowsToXlsxBuffer');

      await service.convert(createMulterFile({ buffer }));

      expect(rowsSpy).toHaveBeenCalledTimes(1);
      expect(xlsxSpy).toHaveBeenCalledWith(rowsSpy.mock.results[0]?.value);
    });
  });
});
