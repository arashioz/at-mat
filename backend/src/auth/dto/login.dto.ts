import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'ایمیل یا شماره موبایل' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'replace-with-your-password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
