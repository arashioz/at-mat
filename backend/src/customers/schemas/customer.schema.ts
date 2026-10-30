import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CustomerType } from '../../common/enums/customer-type.enum';

@Schema({ timestamps: true, versionKey: false })
export class Customer {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: CustomerType, type: String })
  type: CustomerType;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop({ trim: true })
  imageKey?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export type CustomerDocument = HydratedDocument<Customer>;

export const CustomerSchema = SchemaFactory.createForClass(Customer);
