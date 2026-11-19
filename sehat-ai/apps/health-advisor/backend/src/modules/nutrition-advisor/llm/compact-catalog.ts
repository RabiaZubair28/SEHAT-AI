/** Keep planning data; display translations stay in the UI's catalog keyed by food ID. */
export function compactCatalog(text: string): string {
  const context = JSON.parse(text);
  const foods = context.catalog.foods;
  if (!Array.isArray(foods)) throw new Error('Missing food catalog');
  // Foods are already filtered for this patient, so allergen/diet flags are not needed.
  // IDs are readable food names; only the nutrients that drive planning are sent.
  const columns = ['id', 'group', 'slots', 'costTier', 'kcal', 'protein', 'fiber', 'iron', 'sodium'];
  context.catalog = { ...context.catalog, foods: undefined, columns,
    encoding: 'Each foodRows array follows columns order; nutrients are per serving. Null denotes absent catalog data.',
    foodRows: foods.map((food: any) => columns.map((key) => food[key] ?? food.nutrients?.[key] ?? null)) };
  return JSON.stringify(context);
}
