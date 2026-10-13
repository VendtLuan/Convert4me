import { Injectable, UnauthorizedException } from '@nestjs/common';

export type GenesysEmailMessage = Record<string, unknown>;

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

    if (!response.ok) {
      if (response.status === 401) {
        throw new UnauthorizedException();
      }
      const body = await response.text().catch(() => '');
      throw new Error(
        `Genesys GET message failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}`,
      );
    }

    return (await response.json()) as GenesysEmailMessage;
  }
}
