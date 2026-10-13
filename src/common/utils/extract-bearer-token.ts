import type { Request } from 'express';

export function extractBearerToken(request: Pick<Request, 'headers'>): string {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return '';
  }
  return authorization.slice('Bearer '.length).trim();
}
