import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';
import { KitchenMessage, KitchenRecipe } from './kitchen.types';

@Schema({ collection: 'kitchen_members', timestamps: true })
export class KitchenMember {
  _id: Types.ObjectId;
  @Prop({ default: 'مهمان' }) name: string;
  @Prop({ unique: true, sparse: true, lowercase: true }) email?: string;
  @Prop({ select: false }) passwordHash?: string;
  @Prop({ default: true }) guest: boolean;
}
export const KitchenMemberSchema = SchemaFactory.createForClass(KitchenMember);

@Schema({ collection: 'kitchen_sessions' })
export class KitchenSession {
  @Prop({ required: true, unique: true }) tokenHash: string;
  @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true }) memberId: Types.ObjectId;
  @Prop({ required: true, expires: 0 }) expiresAt: Date;
}
export const KitchenSessionSchema = SchemaFactory.createForClass(KitchenSession);

@Schema({ collection: 'kitchen_conversations', timestamps: true })
export class KitchenConversation {
  @Prop({ required: true }) _id: string;
  @Prop({ type: MongoSchema.Types.ObjectId, required: true }) memberId: Types.ObjectId;
  @Prop({ default: 'گفتگوی تازه' }) title: string;
  @Prop({ type: [MongoSchema.Types.Mixed], default: [] }) messages: KitchenMessage[];
  @Prop({ type: Date, default: null }) busyUntil: Date | null;
  @Prop({ default: null, type: String }) lease: string | null;
  updatedAt: Date;
}
export const KitchenConversationSchema = SchemaFactory.createForClass(KitchenConversation);
KitchenConversationSchema.index({ memberId: 1, updatedAt: -1 });

@Schema({ collection: 'kitchen_saved_recipes', timestamps: true })
export class KitchenSavedRecipe {
  _id: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId, required: true }) memberId: Types.ObjectId;
  @Prop({ required: true }) conversationId: string;
  @Prop({ required: true }) messageId: string;
  @Prop({ type: MongoSchema.Types.Mixed, required: true }) recipe: KitchenRecipe;
  createdAt: Date;
}
export const KitchenSavedRecipeSchema = SchemaFactory.createForClass(KitchenSavedRecipe);
KitchenSavedRecipeSchema.index({ memberId: 1, messageId: 1 }, { unique: true });

@Schema({ collection: 'kitchen_limits' })
export class KitchenLimit {
  @Prop({ required: true }) _id: string;
  @Prop({ default: 0 }) count: number;
  @Prop({ required: true, expires: 0 }) expiresAt: Date;
}
export const KitchenLimitSchema = SchemaFactory.createForClass(KitchenLimit);
