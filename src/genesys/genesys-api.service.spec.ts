import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GenesysApiService } from './genesys-api.service';

describe('GenesysApiService', () => {
  const originalFetch = global.fetch;
  const originalGenesysUrl = process.env.GENESYS_API_URL;

  beforeEach(() => {
    process.env.GENESYS_API_URL = 'https://api.example.com';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalGenesysUrl === undefined) {
      delete process.env.GENESYS_API_URL;
    } else {
      process.env.GENESYS_API_URL = originalGenesysUrl;
    }
  });

  it('downloadPdfFromEmailMessage picks PDF attachment and downloads contentUri', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          attachments: [
            {
              name: 'comprovante.pdf',
              contentType: 'application/pdf',
              contentUri: 'https://cdn.example.com/file.pdf',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Uint8Array.from([37, 80, 68, 70]).buffer,
      });
    global.fetch = fetchMock as typeof fetch;

    const service = new GenesysApiService();
    const result = await service.downloadPdfFromEmailMessage(
      'conv-1',
      'msg-1',
      'token',
    );

    expect(result.filename).toBe('comprovante.pdf');
    expect(result.buffer.toString()).toBe('%PDF');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://cdn.example.com/file.pdf');
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
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
