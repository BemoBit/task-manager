import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class EnableTwoFactorDto {
  @ApiProperty({
    example: '123456',
    description: 'Six-digit verification code from authenticator app',
  })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  token!: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty({
    example: '123456',
    description: 'Six-digit TOTP code from authenticator app',
  })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  token!: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({
    example: '123456',
    description: 'Six-digit verification code from authenticator app',
  })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  token!: string;
}
