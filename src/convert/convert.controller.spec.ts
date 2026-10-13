import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { GenesysApiService } from '../genesys/genesys-api.service';
import { ConvertController } from './convert.controller';
import { ConvertService } from './convert.service';
import { ConvertRequestDto } from './dto/convert-request.dto';
import { createMulterFile } from './testing/multer-file.fixture';

describe('ConvertController', () => {
  let controller: ConvertController;
  const convertMock = jest.fn();
  const downloadPdfFromEmailMessageMock = jest.fn();

  beforeEach(async () => {
    convertMock.mockReset();
    downloadPdfFromEmailMessageMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConvertController],
      providers: [
        {
          provide: ConvertService,
          useValue: { convert: convertMock },
        },
        {
          provide: GenesysApiService,
          useValue: {
            downloadPdfFromEmailMessage: downloadPdfFromEmailMessageMock,
          },
        },
      ],
    }).compile();

    controller = module.get(ConvertController);
  });

  it('uses uploaded PDF without calling Genesys', async () => {
    const buffer = Buffer.from('PK-mock-xlsx');
    convertMock.mockResolvedValue({
      buffer,
      filename: 'agenda.xlsx',
    });

    const file = createMulterFile({ buffer: Buffer.from('%PDF') });
    const request = {
      headers: { authorization: 'Bearer test-token' },
    } as Request;

    const result = await controller.convert(file, {}, request);

    expect(downloadPdfFromEmailMessageMock).not.toHaveBeenCalled();
    expect(convertMock).toHaveBeenCalledWith(file);
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it('downloads PDF from Genesys when no file is uploaded', async () => {
    const xlsxBuffer = Buffer.from('PK-mock-xlsx');
    convertMock.mockResolvedValue({
      buffer: xlsxBuffer,
      filename: 'comprovante_pagamento.xlsx',
    });
    downloadPdfFromEmailMessageMock.mockResolvedValue({
      buffer: Buffer.from('%PDF-genesys'),
      filename: 'comprovante_pagamento.pdf',
    });

    const body: ConvertRequestDto = {
      conversationId: 'conv-1',
      messageId: 'msg-1',
    };
    const request = {
      headers: { authorization: 'Bearer test-token' },
    } as Request;

    const result = await controller.convert(undefined, body, request);

    expect(downloadPdfFromEmailMessageMock).toHaveBeenCalledWith(
      'conv-1',
      'msg-1',
      'test-token',
    );
    expect(convertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        buffer: Buffer.from('%PDF-genesys'),
        originalname: 'comprovante_pagamento.pdf',
        mimetype: 'application/pdf',
      }),
    );
    expect(result).toBeInstanceOf(StreamableFile);
  });
});
