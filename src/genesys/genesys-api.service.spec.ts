import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as soulmvPdfFormat from '../convert/pdf/soulmv-pdf-format';
import { GenesysApiService } from './genesys-api.service';

describe('GenesysApiService', () => {
  const originalFetch = global.fetch;
  const originalGenesysUrl = process.env.GENESYS_API_URL;
  const originalMaxPdfCheck = process.env.GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK;

  beforeEach(() => {
    process.env.GENESYS_API_URL = 'https://api.example.com';
    delete process.env.GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK;
    jest.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalGenesysUrl === undefined) {
      delete process.env.GENESYS_API_URL;
    } else {
      process.env.GENESYS_API_URL = originalGenesysUrl;
    }
    if (originalMaxPdfCheck === undefined) {
      delete process.env.GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK;
    } else {
      process.env.GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK = originalMaxPdfCheck;
    }
  });

  it('skips non-SOULMV PDFs and returns the first matching attachment', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          attachments: [
            {
              name: 'comprovante.pdf',
              contentType: 'application/pdf',
              contentUri: 'https://cdn.example.com/invalid.pdf',
            },
            {
              name: 'agenda.pdf',
              contentType: 'application/pdf',
              contentUri: 'https://cdn.example.com/valid.pdf',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([37, 80, 68, 70, 1]).buffer,
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([37, 80, 68, 70, 2]).buffer,
      });
    global.fetch = fetchMock as typeof fetch;

    jest
      .spyOn(soulmvPdfFormat, 'isSoulmvAgendaPdfFormat')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const service = new GenesysApiService();
    const result = await service.downloadPdfFromEmailMessage(
      'conv-1',
      'msg-1',
      'token',
    );

    expect(result.filename).toBe('agenda.pdf');
    expect(result.buffer).toEqual(Buffer.from([37, 80, 68, 70, 2]));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(soulmvPdfFormat.isSoulmvAgendaPdfFormat).toHaveBeenCalledTimes(2);
  });

  it('throws UnauthorizedException when Genesys returns 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => '{"message":"Invalid login credentials."}',
    }) as typeof fetch;

    const service = new GenesysApiService();

    await expect(
      service.getEmailMessage('conv-1', 'msg-1', 'bad'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when message has no PDF attachment', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ attachments: [] }),
    }) as typeof fetch;

    const service = new GenesysApiService();

    await expect(
      service.downloadPdfFromEmailMessage('conv-1', 'msg-1', 'token'),
    ).rejects.toThrow(
      new BadRequestException('No PDF attachment found in the email message.'),
    );
  });

  it('checks at most GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK PDFs', async () => {
    process.env.GENESYS_MAX_PDF_ATTACHMENTS_TO_CHECK = '2';

    const attachments = Array.from({ length: 4 }, (_, index) => ({
      name: `file-${index}.pdf`,
      contentType: 'application/pdf',
      contentUri: `https://cdn.example.com/${index}.pdf`,
    }));

    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ attachments }),
    });
    for (let index = 0; index < 2; index += 1) {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([index]).buffer,
      });
    }
    global.fetch = fetchMock as typeof fetch;

    const formatSpy = jest
      .spyOn(soulmvPdfFormat, 'isSoulmvAgendaPdfFormat')
      .mockResolvedValue(false);

    const service = new GenesysApiService();

    await expect(
      service.downloadPdfFromEmailMessage('conv-1', 'msg-1', 'token'),
    ).rejects.toThrow(BadRequestException);

    expect(formatSpy).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws when every PDF attachment fails SOULMV format check', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          attachments: [
            {
              name: 'a.pdf',
              contentType: 'application/pdf',
              contentUri: 'https://cdn.example.com/a.pdf',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([37, 80, 68, 70]).buffer,
      });
    global.fetch = fetchMock as typeof fetch;

    jest.spyOn(soulmvPdfFormat, 'isSoulmvAgendaPdfFormat').mockResolvedValue(false);

    const service = new GenesysApiService();

    await expect(
      service.downloadPdfFromEmailMessage('conv-1', 'msg-1', 'token'),
    ).rejects.toThrow(
      new BadRequestException(
        'No attachment matches the expected SOULMV agenda PDF format.',
      ),
    );
  });
});
