export function createMulterFile(
  overrides: Partial<Express.Multer.File> & { buffer: Buffer },
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'sample.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: overrides.buffer.length,
    ...overrides,
  } as Express.Multer.File;
}
