import { BadRequestException } from '@nestjs/common';
import { assertSoulmvAgendaLayout, extractTextFromPdf } from './extract-text-from-pdf';

export async function extractValidatedSoulmvAgendaText(
  buffer: Buffer,
): Promise<string> {
  let text: string;
  try {
    text = await extractTextFromPdf(buffer);
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

  return text;
}

export async function validateSoulmvAgendaPdfFormat(
  buffer: Buffer,
): Promise<void> {
  await extractValidatedSoulmvAgendaText(buffer);
}

export async function isSoulmvAgendaPdfFormat(buffer: Buffer): Promise<boolean> {
  try {
    await validateSoulmvAgendaPdfFormat(buffer);
    return true;
  } catch (error) {
    if (error instanceof BadRequestException) {
      return false;
    }
    throw error;
  }
}
