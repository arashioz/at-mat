import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'ChangeMe@12345' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'NewSecret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
