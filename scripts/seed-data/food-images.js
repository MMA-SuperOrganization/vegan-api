// Ingredient artwork, checked 2026-10-15. Source and image URL documentation:
// https://spoonacular.com/food-api/docs#Show-Images
// https://www.themealdb.com/api.php
const spoonacular = (filename) => `https://img.spoonacular.com/ingredients_500x500/${filename}.jpg`;
const mealDb = (name) =>
  `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name)}.png`;

export const FOOD_IMAGE_URLS = Object.freeze({
  Almonds: spoonacular("almonds"),
  Apple: spoonacular("apple"),
  Avocado: spoonacular("avocado"),
  Banana: spoonacular("bananas"),
  "Bell Pepper": spoonacular("bell-pepper-orange"),
  "Black Beans": spoonacular("black-beans"),
  Blueberries: spoonacular("blueberries"),
  Broccoli: spoonacular("broccoli"),
  "Brown Rice": mealDb("Brown Rice"),
  Carrot: spoonacular("carrots"),
  Cashews: spoonacular("cashews"),
  Cauliflower: spoonacular("cauliflower"),
  "Chia Seeds": spoonacular("chia-seeds"),
  Chickpeas: spoonacular("chickpeas"),
  "Coconut Milk": spoonacular("coconut-milk"),
  Corn: spoonacular("corn-on-the-cob"),
  Cucumber: spoonacular("cucumber"),
  Edamame: spoonacular("edamame"),
  Flaxseeds: spoonacular("flax-seeds"),
  "Green Peas": spoonacular("peas"),
  Kale: spoonacular("kale"),
  "Kidney Beans": spoonacular("kidney-beans"),
  Lemon: spoonacular("lemon"),
  Lentils: spoonacular("lentils-brown"),
  Lime: spoonacular("lime"),
  Mango: spoonacular("mango"),
  Mushroom: spoonacular("mushrooms"),
  Mushrooms: spoonacular("mushrooms-white"),
  Oats: spoonacular("rolled-oats"),
  Orange: spoonacular("orange"),
  "Peanut Butter": spoonacular("peanut-butter"),
  Pumpkin: spoonacular("pumpkin"),
  "Pumpkin Seeds": spoonacular("pumpkin-seeds"),
  Quinoa: spoonacular("quinoa"),
  "Red Bell Pepper": spoonacular("red-pepper"),
  "Rice Noodles": spoonacular("rice-noodles"),
  "Sesame Seeds": spoonacular("sesame-seeds"),
  Spinach: spoonacular("spinach"),
  Strawberries: spoonacular("strawberries"),
  "Sweet Potato": spoonacular("sweet-potato"),
  Tahini: mealDb("Tahini"),
  Tempeh: spoonacular("tempeh"),
  Tofu: spoonacular("tofu"),
  Tomato: spoonacular("tomato"),
  Walnuts: spoonacular("walnuts"),
  "Whole Wheat Bread": spoonacular("whole-wheat-bread"),
  "Whole Wheat Pasta": spoonacular("whole-wheat-penne"),
  Zucchini: spoonacular("zucchini"),
});

export function foodImageUrl(name) {
  const url = FOOD_IMAGE_URLS[name];
  if (!url) throw new Error(`Missing ingredient image: ${name}`);
  return url;
}
