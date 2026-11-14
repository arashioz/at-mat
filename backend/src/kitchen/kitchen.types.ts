export interface KitchenRecipe {
  title: string;
  sourceSlug: string;
  sourceTitle: string;
  flavor: string;
  image: string | null;
  servings: number;
  duration: string;
  ingredients: string[];
  preparation: string;
  steps: { title: string; text: string }[];
  tip: string;
}
export interface KitchenReply {
  text: string;
  mode: 'catalog' | 'model';
  recipe: KitchenRecipe | null;
  links: { title: string; href: string }[];
  suggestions: string[];
}
export interface KitchenMessage {
  id: string;
  requestId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  reply?: KitchenReply;
}
