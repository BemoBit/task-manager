import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd',
    description: 'User password',
  })
  @IsString()
  password!: string;

  @ApiProperty({
    example: '123456',
    description: 'Two-factor authentication code (if enabled)',
    required: false,
  })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
