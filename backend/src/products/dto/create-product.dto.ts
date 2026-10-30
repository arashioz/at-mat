import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'بیسکویت کره‌ای ۵۰۰ گرمی' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'BIS-500' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ example: 'بیسکویت' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'بسته', default: 'piece' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 120000, description: 'قیمت به ریال' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 500, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shelfLifeDays?: number;
}
