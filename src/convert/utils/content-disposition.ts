export function buildAttachmentContentDisposition(filename: string): string {
  const normalized = filename.trim() || 'scheduled-patients.xlsx';
  const asciiFallback = normalized
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/["\\]/g, '_')
    .replace(/\s+/g, '_');
  const utf8 = encodeURIComponent(normalized);

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8}`;
}
