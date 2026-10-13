import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isSoulmvAgendaPdfFormat } from '../convert/pdf/soulmv-pdf-format';
import { resolveGenesysMaxPdfAttachmentsToCheck } from './genesys-pdf-scan.constants';
import type {
  GenesysEmailAttachment,
  GenesysEmailMessage,
} from './types/genesys-email-message';

export type GenesysPdfAttachment = {
  buffer: Buffer;
  filename: string;
};

@Injectable()
export class GenesysApiService {
  private baseUrl(): string {
    const url = process.env.GENESYS_API_URL?.replace(/\/$/, '');
    if (!url) {
      throw new Error('GENESYS_API_URL is not configured.');
    }
    return url;
  }

  async getEmailMessage(
    conversationId: string,
    messageId: string,
    bearerToken: string,
  ): Promise<GenesysEmailMessage> {
    const path = `/api/v2/conversations/emails/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`;
    const response = await fetch(`${this.baseUrl()}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'application/json',
      },
    });

    await this.assertGenesysResponse(response, 'GET message');

    return (await response.json()) as GenesysEmailMessage;
  }

  async downloadPdfFromEmailMessage(
    conversationId: string,
    messageId: string,
    bearerToken: string,
  ): Promise<GenesysPdfAttachment> {
    const message = await this.getEmailMessage(
      conversationId,
      messageId,
      bearerToken,
    );
    const pdfAttachments = this.findAllPdfAttachments(message);
    if (pdfAttachments.length === 0) {
      throw new BadRequestException(
        'No PDF attachment found in the email message.',
      );
    }

    const maxToCheck = resolveGenesysMaxPdfAttachmentsToCheck();
    const attachments = pdfAttachments.slice(0, maxToCheck);

    for (const attachment of attachments) {
      if (!attachment.contentUri) {
        continue;
      }

      const buffer = await this.downloadBinary(
        attachment.contentUri,
        bearerToken,
      );
      const matchesFormat = await isSoulmvAgendaPdfFormat(buffer);
      if (!matchesFormat) {
        continue;
      }

      const filename = attachment.name?.trim() || 'attachment.pdf';
      return { buffer, filename };
    }

    throw new BadRequestException(
      'No attachment matches the expected SOULMV agenda PDF format.',
    );
  }

  private findAllPdfAttachments(
    message: GenesysEmailMessage,
  ): GenesysEmailAttachment[] {
    const attachments = message.attachments ?? [];
    return attachments.filter((attachment) => this.isPdfAttachment(attachment));
  }

  private isPdfAttachment(attachment: GenesysEmailAttachment): boolean {
    const contentType = attachment.contentType?.toLowerCase();
    if (contentType === 'application/pdf') {
      return true;
    }
    return attachment.name?.toLowerCase().endsWith('.pdf') ?? false;
  }

  private async downloadBinary(
    contentUri: string,
    bearerToken: string,
  ): Promise<Buffer> {
    const response = await fetch(contentUri, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    await this.assertGenesysResponse(response, 'download attachment');

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async assertGenesysResponse(
    response: Response,
    context: string,
  ): Promise<void> {
    if (response.ok) {
      return;
    }
    if (response.status === 401) {
      throw new UnauthorizedException();
    }
    const body = await response.text().catch(() => '');
    throw new Error(
      `Genesys ${context} failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}`,
    );
  }
}
