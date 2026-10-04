// Unknown egg/dairy composition is excluded from diets that prohibit it.
// Pescatarian uses the vegetarian catalog subset; fish foods are outside this catalog.
export const dietFilter = (diet) => {
  if (diet === "vegan") return { isVegan: true };
  if (diet === "lacto_vegetarian" || diet === "ovo_vegetarian") {
    const excluded = diet === "lacto_vegetarian" ? "containsEggs" : "containsDairy";
    return { $or: [{ isVegan: true }, { isVegetarian: true, [excluded]: false }] };
  }
  if (["vegetarian", "lacto_ovo_vegetarian", "pescatarian"].includes(diet))
    return { $or: [{ isVegetarian: true }, { isVegan: true }] };
  return {};
};
export const fitsDiet = (item, diet) => {
  if (diet === "vegan") return item.isVegan === true;
  if (diet === "lacto_vegetarian" || diet === "ovo_vegetarian") {
    const excluded = diet === "lacto_vegetarian" ? "containsEggs" : "containsDairy";
    return item.isVegan === true || (item.isVegetarian === true && item[excluded] === false);
  }
  if (Object.keys(dietFilter(diet)).length)
    return item.isVegetarian === true || item.isVegan === true;
  return true;
};
