import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    required: false,
    description: 'Required for MANAGER and ADMIN accounts. Six digit TOTP code.',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  totpCode?: string;
}
