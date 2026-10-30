import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ trim: true, lowercase: true, unique: true, sparse: true })
  email?: string;

  @Prop({ trim: true, unique: true, sparse: true })
  phone?: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, enum: Role, type: String })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { passwordHash: _passwordHash, ...rest } = ret;
    return rest;
  },
});
