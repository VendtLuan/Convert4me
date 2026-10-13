import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { buildAttachmentContentDisposition } from '../common/utils/content-disposition';
import { extractBearerToken } from '../common/utils/extract-bearer-token';
import { GenesysApiService } from '../genesys/genesys-api.service';
import { ConvertRequestDto } from './dto/convert-request.dto';
import { ConvertService } from './convert.service';
import { pdfBufferAsMulterFile } from './utils/pdf-as-multer-file';

@Controller('convert')
export class ConvertController {
  constructor(
    private readonly convertService: ConvertService,
    private readonly genesysApiService: GenesysApiService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async convert(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: ConvertRequestDto,
    @Req() request: Request,
  ): Promise<StreamableFile> {
    const pdfFile = await this.resolvePdfFile(file, body, request);

    const { buffer, filename } = await this.convertService.convert(pdfFile);
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: buildAttachmentContentDisposition(filename),
      length: buffer.length,
    });
  }

  private async resolvePdfFile(
    uploadedFile: Express.Multer.File | undefined,
    body: ConvertRequestDto,
    request: Request,
  ): Promise<Express.Multer.File> {
    if (uploadedFile?.buffer?.length) {
      return uploadedFile;
    }

    const conversationId = body.conversationId?.trim();
    const messageId = body.messageId?.trim();
    if (!conversationId || !messageId) {
      throw new BadRequestException(
        'conversationId and messageId are required when no PDF file is uploaded.',
      );
    }

    const bearerToken = extractBearerToken(request);
    const { buffer, filename } =
      await this.genesysApiService.downloadPdfFromEmailMessage(
        conversationId,
        messageId,
        bearerToken,
      );

    return pdfBufferAsMulterFile(buffer, filename);
  }
}
