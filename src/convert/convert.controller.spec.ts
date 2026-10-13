import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConvertController } from './convert.controller';
import { ConvertService } from './convert.service';
import { createMulterFile } from './testing/multer-file.fixture';

describe('ConvertController', () => {
  let controller: ConvertController;
  const convertMock = jest.fn();

  beforeEach(async () => {
    convertMock.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConvertController],
      providers: [
        {
          provide: ConvertService,
          useValue: { convert: convertMock },
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
    const result = await controller.convert(file);

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
