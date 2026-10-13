import { buildAttachmentContentDisposition } from './content-disposition';

describe('buildAttachmentContentDisposition', () => {
  it('builds attachment header with ascii fallback and utf-8 filename', () => {
    const header = buildAttachmentContentDisposition('report (1).xlsx');

    expect(header).toContain('attachment;');
    expect(header).toContain('filename="report_(1).xlsx"');
    expect(header).toContain("filename*=UTF-8''report%20(1).xlsx");
  });

  it('uses default filename when input is blank', () => {
    const header = buildAttachmentContentDisposition('   ');

    expect(header).toContain('filename="scheduled-patients.xlsx"');
  });
});
