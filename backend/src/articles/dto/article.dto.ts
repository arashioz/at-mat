import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { articleCopy, type ArticlePageText } from '../../common/content-copy';
import { IsPageText } from '../../common/decorators/page-text.decorator';
import { ARTICLE_CATEGORIES } from '../schemas/article.schema';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
class ImageDto {
  @IsString() @Matches(/^(general|products|branding)\/[a-zA-Z0-9._-]+$/) @MaxLength(220) key: string;
  @IsString() @MaxLength(240) alt: string;
  @IsOptional() @IsString() @MaxLength(240) caption?: string;
}
class SectionDto {
  @IsString() @Matches(SLUG) @MaxLength(90) id: string;
  @IsString() @MaxLength(180) title: string;
  @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(12000, { each: true }) paragraphs: string[];
  @IsOptional() @IsObject() @ValidateNested() @Type(() => ImageDto) image?: ImageDto | null;
}
class FaqDto {
  @IsString() @MaxLength(300) question: string;
  @IsString() @MaxLength(3000) answer: string;
}
class SourceDto {
  @IsString() @MaxLength(240) title: string;
  @IsString() @Matches(/^(?:https?:\/\/[^\s]+|\/flavors\/[a-z0-9-]+(?:#[a-z0-9-]+)?)?$/) @MaxLength(1800) url: string;
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
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(20) @IsObject({ each: true }) @ValidateNested({ each: true }) @Type(() => SectionDto) sections?: SectionDto[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(10) @IsObject({ each: true }) @ValidateNested({ each: true }) @Type(() => FaqDto) faq?: FaqDto[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(15) @IsObject({ each: true }) @ValidateNested({ each: true }) @Type(() => SourceDto) sources?: SourceDto[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(5) @IsString({ each: true }) @MaxLength(350, { each: true }) takeaways?: string[];
  @IsOptional() @IsObject() @ValidateNested() @Type(() => ImageDto) cover?: ImageDto | null;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => ImageDto) bodyImage?: ImageDto | null;
  @ValidateIf((_object, value) => value !== undefined) @IsString() @Matches(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/) @MaxLength(90) bodyImageAfter?: string;
  @ValidateIf((_object, value) => value !== undefined) @IsPageText(articleCopy) pageText?: ArticlePageText;
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(6) @Matches(SLUG, { each: true }) relatedArticleSlugs?: string[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(6) @Matches(SLUG, { each: true }) relatedRecipeSlugs?: string[];
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(6) @IsIn(['brine', 'sunflower', 'olive-oil', 'pepper', 'smoked', 'dill'], { each: true }) productSlugs?: string[];
}
export class UpdateArticleDto extends PartialType(CreateArticleDto, { skipNullProperties: false }) {}
export class ArticleStatusDto {
  @IsIn(['draft', 'published']) status: 'draft' | 'published';
}
