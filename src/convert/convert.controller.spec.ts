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
  const getEmailMessageMock = jest.fn();

  beforeEach(async () => {
    convertMock.mockReset();
    getEmailMessageMock.mockReset();
    getEmailMessageMock.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConvertController],
      providers: [
        {
          provide: ConvertService,
          useValue: { convert: convertMock },
        },
        {
          provide: GenesysApiService,
          useValue: { getEmailMessage: getEmailMessageMock },
        },
      ],
    }).compile();

    controller = module.get(ConvertController);
  });

  it('returns StreamableFile with spreadsheet headers', async () => {
    const buffer = Buffer.from('PK-mock-xlsx');
    convertMock.mockResolvedValue({
      buffer,
      filename: 'agenda.xlsx',
    });

    const file = createMulterFile({ buffer: Buffer.from('%PDF') });
    const request = {
      headers: { authorization: 'Bearer test-token' },
    } as Request;

    const body: ConvertRequestDto = {
      conversationId: 'conv-1',
      messageId: 'msg-1',
    };

    const result = await controller.convert(file, body, request);

    expect(getEmailMessageMock).toHaveBeenCalledWith(
      'conv-1',
      'msg-1',
      'test-token',
    );
    expect(convertMock).toHaveBeenCalledWith(file);
    expect(result).toBeInstanceOf(StreamableFile);

    const streamable = result as StreamableFile;
    const options = (
      streamable as unknown as {
        options: {
          type: string;
          disposition: string;
          length: number;
        };
      }
    ).options;

    expect(options.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(options.disposition).toContain('attachment;');
    expect(options.disposition).toContain('agenda.xlsx');
    expect(options.length).toBe(buffer.length);
  });
});
