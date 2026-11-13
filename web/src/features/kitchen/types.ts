export type { KitchenMessage, KitchenRecipe, KitchenReply } from '../../../../backend/src/kitchen/kitchen.types';
import type { KitchenMessage, KitchenRecipe } from '../../../../backend/src/kitchen/kitchen.types';
export type Member = { id: string; name: string; guest: boolean };
export type Session = { user: Member | null; mode: 'catalog' | 'model' };
export type Conversation = { id: string; title: string; messages: KitchenMessage[]; updatedAt: string; pending: boolean };
export type ConversationSummary = Pick<Conversation, 'id' | 'title' | 'updatedAt'>;
export type SavedRecipe = { id: string; conversationId: string; messageId: string; recipe: KitchenRecipe; createdAt: string };
