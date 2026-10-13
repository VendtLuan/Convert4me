import { PDFParse } from 'pdf-parse';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export function assertSoulmvAgendaLayout(text: string): void {
  if (!text.includes('Lista de Pacientes Agendados')) {
    throw new Error(
      'Unrecognized SOULMV layout: scheduled patient list not found.',
    );
  }
}
