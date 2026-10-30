import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';
import { PHONE_REGEX } from '../../common/utils/phone.util';

export class CreateUserDto {
  @ApiProperty({ example: 'Ali Ahmadi' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: 'ali@example.com', description: 'ایمیل (اختیاری، اگر شماره نداد الزامی است)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '09120000000', description: 'شماره موبایل (اختیاری، اگر ایمیل نداد الزامی است)' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'شماره موبایل معتبر نیست (مثال: 09120000000)' })
  phone?: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.MARKETER })
  @IsEnum(Role)
  role: Role;
}
