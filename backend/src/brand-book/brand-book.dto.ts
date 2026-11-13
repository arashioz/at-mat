import { Type, Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNotEmpty, IsObject, IsString, Matches, MaxLength, Min, ValidateNested } from 'class-validator';
import { BRAND_SOURCES, BrandBookContent, BrandChapter, BrandReference, SourceId } from './brand-book.content';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export const BRAND_IMAGE_KEY = /^(branding|products|general)\/[a-z0-9._-]+\.(png|jpe?g|webp)$/i;

class ReferenceDto implements BrandReference {
  @IsIn(BRAND_SOURCES.map(source => source.id))
  source: SourceId;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(140)
  location: string;
}

class SectionDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120)
  title: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(4000)
  body: string;
}

class ChapterDto implements BrandChapter {
  @Matches(/^[a-z0-9][a-z0-9-]{0,63}$/)
  id: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120)
  title: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(800)
  summary: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => SectionDto)
  sections: SectionDto[];

  @IsArray() @ArrayMaxSize(6) @ValidateNested({ each: true }) @Type(() => ReferenceDto)
  references: ReferenceDto[];
}

class CaptionDto {
  @Matches(BRAND_IMAGE_KEY)
  key: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(180)
  caption: string;
}

class CoverDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100)
  title: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150)
  tagline: string;
}

export class UpdateBrandBookDto implements BrandBookContent {
  @IsInt() @Min(0)
  revision: number;

  @IsObject() @ValidateNested() @Type(() => CoverDto)
  cover: CoverDto;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(18) @ValidateNested({ each: true }) @Type(() => ChapterDto)
  chapters: ChapterDto[];

  @IsArray() @ArrayMaxSize(250) @ValidateNested({ each: true }) @Type(() => CaptionDto)
  assetCaptions: CaptionDto[];
}

export class BrandQuestionDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(500)
  question: string;
}
