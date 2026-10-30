import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'ایمیل یا شماره موبایل' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'ChangeMe@12345' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
