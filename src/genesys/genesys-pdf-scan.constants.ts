/** Máximo de anexos PDF verificados por mensagem (ordem da API). */
export const DEFAULT_GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK = 5;

export function resolveGenesysMaxPdfAttachmentsToCheck(): number {
  const raw = process.env.GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK;
  if (!raw?.trim()) {
    return DEFAULT_GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK;
  }

  return parsed;
}
