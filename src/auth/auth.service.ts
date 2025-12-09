import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Role } from './role.enum.js';
import { AuthUser } from './interfaces/auth-user.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const password = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password,
        role: Role.USER,
      },
    });

    return {
      user: this.stripSensitiveUserData(user),
      accessToken: await this.signToken(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      user: this.stripSensitiveUserData(user),
      accessToken: await this.signToken(user),
    };
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.stripSensitiveUserData(user);
  }

  private async signToken(user: { id: number; email: string; role: Role }) {
    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn =
      (this.configService.get<string>('auth.expiresIn') ?? '1h') as JwtSignOptions['expiresIn'];

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      expiresIn,
    });
  }

  private stripSensitiveUserData(user: { password: string; [key: string]: unknown }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }
}
