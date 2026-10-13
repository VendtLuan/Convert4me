import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedToken = process.env.AUTH_TOKEN;
    if (!expectedToken) {
      throw new UnauthorizedException('Server authentication is not configured.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (token !== expectedToken) {
      throw new UnauthorizedException('Invalid authentication token.');
    }

    return true;
  }
}
