import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConvertRequestDto {
  /** Obrigatório quando o PDF não é enviado no multipart (fluxo Genesys). */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  conversationId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  messageId?: string;
}
