export type NutritionLevel = 'low' | 'mid' | 'high';
export interface Ingredient { id: string; title: string; fact: string; numeral?: string }
export interface ProductNutrition {
  serving: string;
  rows: readonly { name: string; value: string; unit: string; level: NutritionLevel | null }[];
  legend: readonly { level: NutritionLevel; label: string }[];
}
export interface ProductCopy {
  headline: readonly string[];
  giant: string;
  name: string;
  netWeight: string;
  description: string;
  steps: readonly Ingredient[];
  nutrition: ProductNutrition;
  notes: readonly { figure: string; unit: string; text: string }[];
  storage: string;
  warning: string;
  origin: string;
  recipes: {
    title: readonly string[];
    note: string;
    items: readonly { id: string; numeral: string; title: string; line: string; href: `/recipes/${string}`; image: string }[];
  };
  contact: { phone: { label: string; href: string }; email: { label: string; href: string } };
}
export interface FlavorTheme {
  heroText?: string;
  accent: string;
  deep: string;
  navy: string;
  pale: string;
  notes: string;
  heroTop: string;
  heroBottom: string;
  heroGlow: string;
  light: readonly [number, number, number];
}
export interface FlavorDefinition {
  slug: string;
  label: string;
  metadataTitle: string;
  copy: ProductCopy;
  theme: FlavorTheme;
  mediaPrefix: string;
}
