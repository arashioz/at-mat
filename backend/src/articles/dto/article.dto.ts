import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { ARTICLE_CATEGORIES } from '../schemas/article.schema';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
class SectionDto {
  @IsString() @Matches(SLUG) @MaxLength(90) id: string;
  @IsString() @IsNotEmpty() @MaxLength(180) title: string;
  @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(12000, { each: true }) paragraphs: string[];
}
class ImageDto {
  @IsString() @Matches(/^(general|products|branding)\/[a-zA-Z0-9._-]+$/) @MaxLength(220) key: string;
  @IsString() @IsNotEmpty() @MaxLength(240) alt: string;
}
class FaqDto {
  @IsString() @IsNotEmpty() @MaxLength(300) question: string;
  @IsString() @IsNotEmpty() @MaxLength(3000) answer: string;
}
class SourceDto {
  @IsString() @IsNotEmpty() @MaxLength(240) title: string;
  @IsString() @Matches(/^(https?:\/\/[^\s]+|\/flavors\/[a-z0-9-]+(?:#[a-z0-9-]+)?)$/) @MaxLength(1800) url: string;
}
export class CreateArticleDto {
  @IsString() @Matches(SLUG) @MaxLength(90) slug: string;
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsString() @IsIn(ARTICLE_CATEGORIES) category: string;
  @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(400) excerpt?: string;
  @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(7000) intro?: string;
  @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(100) author?: string;
  @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(100) seoTitle?: string;
  @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(200) metaDescription?: string;
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(60, { each: true }) tags?: string[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => SectionDto) sections?: SectionDto[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => FaqDto) faq?: FaqDto[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(15) @ValidateNested({ each: true }) @Type(() => SourceDto) sources?: SourceDto[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(5) @IsString({ each: true }) @MaxLength(350, { each: true }) takeaways?: string[];
  @IsOptional() @ValidateNested() @Type(() => ImageDto) cover?: ImageDto;
  @IsOptional() @ValidateNested() @Type(() => ImageDto) bodyImage?: ImageDto;
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(6) @Matches(SLUG, { each: true }) relatedArticleSlugs?: string[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(6) @Matches(SLUG, { each: true }) relatedRecipeSlugs?: string[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(6) @IsIn(['brine', 'sunflower', 'olive-oil', 'pepper', 'smoked', 'dill'], { each: true }) productSlugs?: string[];
}
export class UpdateArticleDto extends PartialType(CreateArticleDto, { skipNullProperties: false }) {}
export class ArticleStatusDto {
  @IsIn(['draft', 'published']) status: 'draft' | 'published';
}
