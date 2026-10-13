import {
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
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ConvertRequestDto,
    @Req() request: Request,
  ): Promise<StreamableFile> {
    const bearerToken = extractBearerToken(request);

    await this.genesysApiService.getEmailMessage(
      body.conversationId,
      body.messageId,
      bearerToken,
    );

    const { buffer, filename } = await this.convertService.convert(file);
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: buildAttachmentContentDisposition(filename),
      length: buffer.length,
    });
  }
}
