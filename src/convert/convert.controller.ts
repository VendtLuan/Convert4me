import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthTokenGuard } from '../common/guards/auth-token.guard';
import { buildAttachmentContentDisposition } from '../common/utils/content-disposition';
import { GenesysApiService } from '../genesys/genesys-api.service';
import { ConvertService } from './convert.service';

function extractBearerToken(request: Request): string {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return '';
  }
  return authorization.slice('Bearer '.length).trim();
}

@Controller('convert')
@UseGuards(AuthTokenGuard)
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
    @Body('conversationId') conversationId: string,
    @Body('messageId') messageId: string,
    @Req() request: Request,
  ): Promise<StreamableFile> {
    const bearerToken = extractBearerToken(request);

    await this.genesysApiService.getEmailMessage(
      conversationId,
      messageId,
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
