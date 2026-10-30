import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  sku: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ required: true, default: 'piece', trim: true })
  unit: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0, default: 0 })
  stockQuantity: number;

  @Prop({ min: 0 })
  shelfLifeDays?: number;

  @Prop({ trim: true })
  imageKey?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export type ProductDocument = HydratedDocument<Product>;

export const ProductSchema = SchemaFactory.createForClass(Product);
