// The catalog stores vegan/vegetarian suitability, not separate egg/dairy/fish flags.
// Specific vegetarian diets and pescatarian therefore use the conservative vegetarian subset.
export const dietFilter = (diet) => {
  if (diet === "vegan") return { isVegan: true };
  if (
    [
      "vegetarian",
      "lacto_vegetarian",
      "ovo_vegetarian",
      "lacto_ovo_vegetarian",
      "pescatarian",
    ].includes(diet)
  )
    return { $or: [{ isVegetarian: true }, { isVegan: true }] };
  return {};
};
export const fitsDiet = (item, diet) => {
  if (diet === "vegan") return item.isVegan === true;
  if (Object.keys(dietFilter(diet)).length)
    return item.isVegetarian === true || item.isVegan === true;
  return true;
};
