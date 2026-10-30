import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { IMAGE_CATEGORIES } from '../storage.service';

export class UploadImageDto {
  @ApiProperty({ enum: IMAGE_CATEGORIES, example: 'products' })
  @IsIn(IMAGE_CATEGORIES as unknown as string[])
  category: string;

  @ApiPropertyOptional({ example: 'عکس بسته ۵۰۰ گرمی' })
  @IsOptional()
  @IsString()
  description?: string;
}
