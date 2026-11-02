import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class FeatureFlag {
  @Prop({ required: true, unique: true, trim: true })
  key: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, trim: true })
  group: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: true })
  enabled: boolean;
}

export type FeatureFlagDocument = HydratedDocument<FeatureFlag>;

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);
