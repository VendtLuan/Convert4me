import { BadRequestException, Injectable } from '@nestjs/common';
import { rowsToXlsxBuffer } from './excel/agenda-to-xlsx';
import { parseSoulmvAgendaText } from './parser/soulmv-agenda.parser';
import {
  assertSoulmvAgendaLayout,
  extractTextFromPdf,
} from './pdf/extract-text-from-pdf';

export type ConvertXlsxResult = {
  buffer: Buffer;
  filename: string;
};

@Injectable()
export class ConvertService {
  async convert(file: Express.Multer.File): Promise<ConvertXlsxResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Arquivo não enviado ou vazio.');
    }

    if (
      file.mimetype !== 'application/pdf' &&
      !file.originalname.endsWith('.pdf')
    ) {
      throw new BadRequestException('Envie um arquivo PDF.');
    }

    let text: string;
    try {
      text = await extractTextFromPdf(file.buffer);
    } catch {
      throw new BadRequestException('Não foi possível ler o PDF.');
    }

    try {
      assertSoulmvAgendaLayout(text);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Layout SOULMV não reconhecido.';
      throw new BadRequestException(message);
    }

    const rows = parseSoulmvAgendaText(text);
    if (rows.length === 0) {
      throw new BadRequestException(
        'Nenhum paciente encontrado no PDF. Verifique o layout do relatório.',
      );
    }

    const buffer = await rowsToXlsxBuffer(rows);
    const baseName = file.originalname.replace(/\.pdf$/i, '') || 'agendamentos';

    return {
      buffer,
      filename: `${baseName}.xlsx`,
    };
  }
}
