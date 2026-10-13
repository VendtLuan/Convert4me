export function pdfBufferAsMulterFile(
  buffer: Buffer,
  originalname: string,
): Express.Multer.File {
  const name = originalname.trim() || 'attachment.pdf';

  return {
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
  } as Express.Multer.File;
}
