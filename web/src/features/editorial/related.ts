export function inSelectionOrder<Item extends { slug: string }>(items: readonly Item[], slugs: readonly string[]): Item[] {
  const bySlug = new Map(items.map(item => [item.slug, item]));
  return [...new Set(slugs)].flatMap(slug => {
    const item = bySlug.get(slug);
    return item ? [item] : [];
  });
}

export function relatedRecipesFor<Item extends { slug: string; category: string }>(
  recipes: readonly Item[], slug: string, category: string, selected?: readonly string[],
): Item[] {
  const others = recipes.filter(recipe => recipe.slug !== slug);
  if (selected) return inSelectionOrder(others, selected);
  return [...others.filter(recipe => recipe.category === category), ...others.filter(recipe => recipe.category !== category)].slice(0, 3);
}
