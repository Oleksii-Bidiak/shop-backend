import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

import { AuthService } from './auth.service.js';
import { Role } from './role.enum.js';

const configValues: Record<string, unknown> = {
  'auth.jwtSecret': 'jwt-secret',
  'auth.expiresIn': '1h',
  'auth.totpSecret': 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD',
};

describe('AuthService two-factor authentication', () => {
  const prisma = { user: { findUnique: jest.fn() } } as unknown as any;
  const jwtService = { signAsync: jest.fn() } as unknown as JwtService;
  const configService = {
    get: jest.fn((key: string) => configValues[key]),
    getOrThrow: jest.fn((key: string) => configValues[key]),
  } as unknown as ConfigService;

  const authService = new AuthService(prisma, jwtService, configService);
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash('password', 1);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (jwtService.signAsync as jest.Mock).mockResolvedValue('signed-token');
  });

  it('allows regular users to log in without TOTP', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: hashedPassword,
      role: Role.USER,
    });

    const result = await authService.login({ email: 'user@example.com', password: 'password' });

    expect(result.user).toMatchObject({ email: 'user@example.com', role: Role.USER });
    expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
  });

  it('rejects privileged users without a TOTP code', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      email: 'manager@example.com',
      password: hashedPassword,
      role: Role.MANAGER,
    });

    await expect(
      authService.login({ email: 'manager@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects privileged users with an invalid TOTP code', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 3,
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
    });

    await expect(
      authService.login({ email: 'admin@example.com', password: 'password', totpCode: '000000' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts privileged users with a valid TOTP code', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 4,
      email: 'manager@example.com',
      password: hashedPassword,
      role: Role.MANAGER,
    });

    const totpCode = authenticator.generate(configValues['auth.totpSecret'] as string);

    const result = await authService.login({
      email: 'manager@example.com',
      password: 'password',
      totpCode,
    });

    expect(result.user).toMatchObject({ email: 'manager@example.com', role: Role.MANAGER });
    expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
  });
});
