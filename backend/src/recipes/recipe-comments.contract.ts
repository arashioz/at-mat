export const recipeCommentLimits = { nameMin: 2, nameMax: 60, messageMin: 5, messageMax: 800 } as const;

export interface PublicRecipeComment {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export interface RecipeCommentPage {
  items: PublicRecipeComment[];
  nextCursor: string | null;
}
