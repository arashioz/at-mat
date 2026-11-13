import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { CustomerType } from '../../common/enums/customer-type.enum';
import { normalizePhone, PHONE_REGEX } from '../../common/utils/phone.util';

export class CreateCustomerDto {
  @ApiProperty({ example: 'فروشگاه رضایی' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CustomerType, example: CustomerType.STORE })
  @IsEnum(CustomerType)
  type: CustomerType;

  @ApiProperty({ example: '09120000000' })
  @Transform(({ value }) => typeof value === 'string' ? normalizePhone(value) : value)
  @Matches(PHONE_REGEX, { message: 'شماره موبایل معتبر نیست (مثال: 09120000000)' })
  phone: string;

  @ApiPropertyOptional({ example: 'تهران' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'خیابان ولیعصر، پلاک ۱۲' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'شناسه کاربر بازاریاب یا مدیر فروش مسئول' })
  @IsOptional()
  @IsMongoId()
  assignedTo?: string;
}
