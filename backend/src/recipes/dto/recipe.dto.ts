import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { recipeCopy, type RecipePageText } from '../../common/content-copy';
import { IsPageText } from '../../common/decorators/page-text.decorator';
import { RECIPE_FLAVORS, RECIPE_IMAGE_KEY, RECIPE_SLUG, RecipeFields } from '../recipe.types';

class RecipePhotoDto {
  @IsString() @Matches(RECIPE_IMAGE_KEY) @MaxLength(220) key: string;
  @IsOptional() @IsString() @MaxLength(240) alt?: string;
  @IsInt() @Min(1) @Max(20_000) width: number;
  @IsInt() @Min(1) @Max(20_000) height: number;
  @IsOptional() @IsBoolean() generated?: boolean;
  @IsOptional() @IsString() @MaxLength(240) caption?: string;
}

class RecipePhotosDto {
  @IsOptional() @IsObject() @ValidateNested() @Type(() => RecipePhotoDto) 'cover-a'?: RecipePhotoDto;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => RecipePhotoDto) 'cover-b'?: RecipePhotoDto;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => RecipePhotoDto) ingredients?: RecipePhotoDto;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => RecipePhotoDto) 'key-step'?: RecipePhotoDto;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => RecipePhotoDto) 'serving-detail'?: RecipePhotoDto;
}

class RecipeStepDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(4000) text?: string;
}

class RecipeNutritionRowDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(160) value?: string;
}

class RecipeNutritionDto {
  @IsOptional() @IsString() @MaxLength(120) serving?: string;
  @IsOptional() @IsString() @MaxLength(3000) note?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsObject({ each: true })
  @ValidateNested({ each: true }) @Type(() => RecipeNutritionRowDto) rows?: RecipeNutritionRowDto[];
}

class RecipeFaqDto {
  @IsOptional() @IsString() @MaxLength(300) question?: string;
  @IsOptional() @IsString() @MaxLength(4000) answer?: string;
}

class RecipeSectionDto {
  @IsString() @MaxLength(180) title: string;
  @IsString() @MaxLength(6000) text: string;
}

export class RecipeFieldsDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) intro?: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsIn(['', ...RECIPE_FLAVORS]) flavor?: RecipeFields['flavor'];
  @IsOptional() @IsString() @MaxLength(120) flavorLabel?: string;
  @IsOptional() @IsString() @MaxLength(120) servings?: string;
  @IsOptional() @IsString() @MaxLength(120) timing?: string;
  @IsOptional() @IsString() @MaxLength(120) duration?: string;
  @IsOptional() @IsString() @MaxLength(120) difficulty?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) @MaxLength(500, { each: true }) ingredients?: string[];
  @IsOptional() @IsString() @MaxLength(4000) preparation?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsObject({ each: true })
  @ValidateNested({ each: true }) @Type(() => RecipeStepDto) steps?: RecipeStepDto[];
  @IsOptional() @IsString() @MaxLength(4000) tip?: string;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => RecipeNutritionDto) nutrition?: RecipeNutritionDto;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsObject({ each: true })
  @ValidateNested({ each: true }) @Type(() => RecipeFaqDto) faq?: RecipeFaqDto[];
  @IsOptional() @IsString() @MaxLength(200) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(400) metaDescription?: string;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => RecipePhotosDto) photos?: RecipePhotosDto;
  @IsOptional() @IsPageText(recipeCopy) pageText?: RecipePageText;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsObject({ each: true })
  @ValidateNested({ each: true }) @Type(() => RecipeSectionDto) extraSections?: RecipeSectionDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(6) @ArrayUnique() @Matches(RECIPE_SLUG, { each: true }) @MaxLength(90, { each: true }) relatedRecipeSlugs?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(6) @ArrayUnique() @Matches(RECIPE_SLUG, { each: true }) @MaxLength(90, { each: true }) relatedArticleSlugs?: string[];
}

export class RecipeRevisionDto {
  @IsOptional() @IsInt() @Min(0) expectedRevision?: number | null;
}

export class SaveRecipeDraftDto extends RecipeRevisionDto {
  @IsObject() @ValidateNested() @Type(() => RecipeFieldsDto) draft: RecipeFieldsDto;
}

export class CreateRecipeDto {
  @IsString() @Matches(RECIPE_SLUG) @MaxLength(90) slug: string;
  @IsObject() @ValidateNested() @Type(() => RecipeFieldsDto) draft: RecipeFieldsDto;
}
