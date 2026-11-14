import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { recipeCommentLimits as limits } from '../recipe-comments.contract';

@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
export class RecipeComment {
  @Prop({ required: true }) recipeId: number;
  @Prop({ required: true }) requestId: string;
  @Prop({ required: true, trim: true, minlength: limits.nameMin, maxlength: limits.nameMax }) name: string;
  @Prop({ required: true, trim: true, minlength: limits.messageMin, maxlength: limits.messageMax }) message: string;
  createdAt: Date;
}

export const RecipeCommentSchema = SchemaFactory.createForClass(RecipeComment);
RecipeCommentSchema.index({ recipeId: 1, requestId: 1 }, { unique: true });
RecipeCommentSchema.index({ recipeId: 1, _id: -1 });
