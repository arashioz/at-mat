import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { collaborationKinds, type CollaborationKind } from '../common/collaboration';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CollaborationRequest {
  @Prop({ type: String, required: true }) _id: string;
  @Prop({ type: String, enum: collaborationKinds, required: true }) kind: CollaborationKind;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) phone: string;
  @Prop({ required: true }) city: string;
  @Prop() email?: string;
  @Prop() company?: string;
  @Prop() jobArea?: string;
  @Prop() resumeUrl?: string;
  @Prop({ required: true }) details: string;
  @Prop({ default: false }) reviewed: boolean;
  createdAt: Date;
}

export const CollaborationRequestSchema = SchemaFactory.createForClass(CollaborationRequest);
CollaborationRequestSchema.index({ createdAt: -1, _id: -1 });
