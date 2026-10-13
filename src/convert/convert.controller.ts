import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthTokenGuard } from '../common/guards/auth-token.guard';
import { buildAttachmentContentDisposition } from '../common/utils/content-disposition';
import { ConvertService } from './convert.service';

@Controller('convert')
@UseGuards(AuthTokenGuard)
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async convert(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.convertService.convert(file);
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: buildAttachmentContentDisposition(filename),
      length: buffer.length,
    });
  }
}
