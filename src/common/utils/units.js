export const UNITS = Object.freeze([
  "g",
  "kg",
  "ml",
  "l",
  "piece",
  "tbsp",
  "tsp",
  "cup",
  "serving",
]);
const dimensions = { g: ["mass", 1], kg: ["mass", 1000], ml: ["volume", 1], l: ["volume", 1000] };
export const normalizeUnit = (unit) =>
  typeof unit === "string" && UNITS.includes(unit.trim().toLowerCase())
    ? unit.trim().toLowerCase()
    : null;

/** Only metric mass and metric volume conversions are implicit. */
export function convertQuantity(quantity, from, to) {
  from = normalizeUnit(from);
  to = normalizeUnit(to);
  if (!Number.isFinite(quantity) || quantity < 0 || !from || !to) return null;
  if (from === to) return quantity;
  const a = dimensions[from];
  const b = dimensions[to];
  return a && b && a[0] === b[0] ? (quantity * a[1]) / b[1] : null;
}

/** gramEquivalent is the grams for this full quantity, not grams per unit. */
export function quantityToGrams(quantity, unit, { gramEquivalent, defaultServing } = {}) {
  unit = normalizeUnit(unit);
  if (!unit || !Number.isFinite(quantity) || quantity <= 0) return null;
  const mass = convertQuantity(quantity, unit, "g");
  if (mass !== null) return mass;
  if (Number.isFinite(gramEquivalent) && gramEquivalent > 0) return gramEquivalent;
  if (
    defaultServing &&
    Number.isFinite(defaultServing.amount) &&
    defaultServing.amount > 0 &&
    Number.isFinite(defaultServing.gramEquivalent) &&
    defaultServing.gramEquivalent > 0
  ) {
    const amount = convertQuantity(quantity, unit, defaultServing.unit);
    if (amount !== null) return (amount / defaultServing.amount) * defaultServing.gramEquivalent;
  }
  return null;
}

/** Preserve incompatible quantities instead of pretending that cups or pieces have a density. */
export function mergeIngredients(items) {
  const merged = new Map();
  for (const original of items) {
    if (!Number.isFinite(original.quantity) || original.quantity < 0)
      throw new RangeError("Invalid ingredient quantity");
    const unit = normalizeUnit(original.unit);
    if (!unit) throw new RangeError("Unsupported ingredient unit");
    const grams = quantityToGrams(original.quantity, unit, original);
    const canonical = grams !== null ? "g" : unit === "l" ? "ml" : unit;
    const quantity = grams !== null ? grams : convertQuantity(original.quantity, unit, canonical);
    const identity = original.foodItemId
      ? String(original.foodItemId)
      : `name:${String(original.nameSnapshot ?? original.foodNameSnapshot ?? original.name ?? "")
          .trim()
          .toLowerCase()}`;
    const key = JSON.stringify([identity, canonical]);
    const existing = merged.get(key);
    if (existing) existing.quantity += quantity;
    else {
      const item = { ...original, unit: canonical, quantity };
      delete item.gramEquivalent;
      delete item.defaultServing;
      merged.set(key, item);
    }
  }
  return [...merged.values()].map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * 1e8) / 1e8,
  }));
}

/** Spend each pantry quantity once, and only against compatible demand. */
export function subtractPantry(items, pantryItems) {
  const available = mergeIngredients(pantryItems).map((item) => ({ ...item }));
  return mergeIngredients(items)
    .map((item) => {
      let quantity = item.quantity;
      for (const stock of available) {
        if (!item.foodItemId || String(stock.foodItemId) !== String(item.foodItemId)) continue;
        const convertible = convertQuantity(stock.quantity, stock.unit, item.unit);
        if (convertible === null) continue;
        const used = Math.min(quantity, convertible);
        quantity -= used;
        stock.quantity -= convertQuantity(used, item.unit, stock.unit);
      }
      return { ...item, quantity: Math.max(0, Math.round(quantity * 1e8) / 1e8) };
    })
    .filter((item) => item.quantity > 0);
}
