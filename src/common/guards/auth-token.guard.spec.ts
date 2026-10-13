import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthTokenGuard } from './auth-token.guard';

function createContext(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization ? { authorization } : {},
      }),
    }),
  } as ExecutionContext;
}

describe('AuthTokenGuard', () => {
  const guard = new AuthTokenGuard();
  const originalAuthToken = process.env.AUTH_TOKEN;

  afterEach(() => {
    if (originalAuthToken === undefined) {
      delete process.env.AUTH_TOKEN;
    } else {
      process.env.AUTH_TOKEN = originalAuthToken;
    }
  });

  it('allows requests when bearer token matches AUTH_TOKEN', () => {
    process.env.AUTH_TOKEN = 'secret-token';

    expect(guard.canActivate(createContext('Bearer secret-token'))).toBe(true);
  });

  it('rejects when AUTH_TOKEN is not configured', () => {
    delete process.env.AUTH_TOKEN;

    expect(() => guard.canActivate(createContext('Bearer any'))).toThrow(
      new UnauthorizedException('Server authentication is not configured.'),
    );
  });

  it('rejects missing or non-bearer authorization header', () => {
    process.env.AUTH_TOKEN = 'secret-token';

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(createContext('Token secret-token'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when bearer token does not match', () => {
    process.env.AUTH_TOKEN = 'secret-token';

    expect(() => guard.canActivate(createContext('Bearer wrong'))).toThrow(
      new UnauthorizedException('Invalid authentication token.'),
    );
  });
});
