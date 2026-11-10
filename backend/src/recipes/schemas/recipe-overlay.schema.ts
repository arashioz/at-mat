import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongoSchema } from 'mongoose';
import { RecipeFields, RecipeIdentity } from '../recipe.types';

@Schema({ timestamps: true, optimisticConcurrency: true, versionKey: 'version', minimize: false })
export class RecipeOverlay implements RecipeIdentity {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ required: true, unique: true }) id: number;
  @Prop({ required: true }) number: string;

  // Each content snapshot is validated and replaced as a whole through the CMS.
  @Prop({ type: MongoSchema.Types.Mixed, required: true }) draft: RecipeFields;
  @Prop({ type: MongoSchema.Types.Mixed, default: null }) published: RecipeFields | null;

  version: number;
  updatedAt?: Date;
}

export type RecipeOverlayDocument = HydratedDocument<RecipeOverlay>;
export const RecipeOverlaySchema = SchemaFactory.createForClass(RecipeOverlay);
