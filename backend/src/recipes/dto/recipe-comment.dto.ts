import { Transform, type TransformFnParams } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { recipeCommentLimits as limits } from '../recipe-comments.contract';

const trim = ({ value }: TransformFnParams) => typeof value === 'string' ? value.trim() : value;

export class CreateRecipeCommentDto {
  @IsUUID('4')
  requestId: string;

  @Transform(trim)
  @IsString()
  @Length(limits.nameMin, limits.nameMax, { message: 'نام نمایشی را بین ۲ تا ۶۰ نویسه وارد کنید.' })
  name: string;

  @Transform(trim)
  @IsString()
  @Length(limits.messageMin, limits.messageMax, { message: 'دیدگاه را بین ۵ تا ۸۰۰ نویسه بنویسید.' })
  message: string;
}

export class RecipeCommentsQueryDto {
  @IsOptional()
  @IsMongoId()
  before?: string;
}
