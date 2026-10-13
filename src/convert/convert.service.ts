import { BadRequestException, Injectable } from '@nestjs/common';
import { rowsToXlsxBuffer } from './excel/agenda-to-xlsx';
import { parseSoulmvAgendaText } from './parser/soulmv-agenda.parser';
import {
  assertSoulmvAgendaLayout,
  extractTextFromPdf,
} from './pdf/extract-text-from-pdf';
import type { ConvertXlsxResult } from './types/convert-xlsx-result';

@Injectable()
export class ConvertService {
  async convert(file: Express.Multer.File): Promise<ConvertXlsxResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File was not sent or is empty.');
    }

    if (
      file.mimetype !== 'application/pdf' &&
      !file.originalname.endsWith('.pdf')
    ) {
      throw new BadRequestException('Upload a PDF file.');
    }

    let text: string;
    try {
      text = await extractTextFromPdf(file.buffer);
    } catch {
      throw new BadRequestException('Could not read the PDF.');
    }

    try {
      assertSoulmvAgendaLayout(text);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unrecognized SOULMV layout.';
      throw new BadRequestException(message);
    }

    const rows = parseSoulmvAgendaText(text);
    if (rows.length === 0) {
      throw new BadRequestException(
        'No patients found in the PDF. Check the report layout.',
      );
    }

    const buffer = await rowsToXlsxBuffer(rows);
    const baseName =
      file.originalname.replace(/\.pdf$/i, '') || 'scheduled-patients';

    return {
      buffer,
      filename: `${baseName}.xlsx`,
    };
  }
}
