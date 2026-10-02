import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { User } from "../src/modules/users/user.model.js";
import { Category } from "../src/modules/categories/category.model.js";
import { Allergen } from "../src/modules/allergens/allergen.model.js";
import { FoodItem } from "../src/modules/food-items/food-item.model.js";
import { Recipe } from "../src/modules/recipes/recipe.model.js";

dotenv.config();

const logger = console;

const runSeed = async () => {
  if (!process.env.MONGODB_URI) {
    logger.error("MONGODB_URI is not set in environment");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  logger.info("Connected to MongoDB");

  const skipAdmin = process.env.SEED_ADMIN_FIREBASE_UID === "CHANGE_ME";
  if (skipAdmin) {
    logger.warn("SEED_ADMIN_FIREBASE_UID is CHANGE_ME, skipping admin creation");
  } else if (process.env.SEED_ADMIN_FIREBASE_UID && process.env.SEED_ADMIN_EMAIL) {
    const adminRes = await User.findOneAndUpdate(
      { firebaseUid: process.env.SEED_ADMIN_FIREBASE_UID },
      {
        $set: {
          email: process.env.SEED_ADMIN_EMAIL,
          role: "ADMIN",
          status: "active",
          displayName: "System Admin",
        },
      },
      { upsert: true, new: true },
    );
    logger.info(`Upserted admin user: ${adminRes.email}`);
  }

  // Categories
  const categoryData = [
    { name: "Breakfast", type: "recipe", isActive: true },
    { name: "Lunch", type: "recipe", isActive: true },
    { name: "Dinner", type: "recipe", isActive: true },
    { name: "Snack", type: "recipe", isActive: true },
    { name: "Dessert", type: "recipe", isActive: true },
    { name: "Vegetables", type: "food", isActive: true },
    { name: "Fruits", type: "food", isActive: true },
    { name: "Grains", type: "food", isActive: true },
    { name: "Legumes", type: "food", isActive: true },
    { name: "Nuts & Seeds", type: "food", isActive: true },
    { name: "Nutrition", type: "post", isActive: true },
    { name: "Lifestyle", type: "post", isActive: true },
  ];

  let catCount = 0;
  const categories = {};
  for (const cat of categoryData) {
    const res = await Category.findOneAndUpdate(
      { name: cat.name, type: cat.type },
      { $set: cat },
      { upsert: true, new: true },
    );
    categories[cat.name] = res._id;
    catCount++;
  }
  logger.info(`Upserted ${catCount} categories`);

  // Allergens
  const allergenData = [
    { name: "Peanuts", isActive: true },
    { name: "Tree Nuts", isActive: true },
    { name: "Soy", isActive: true },
    { name: "Wheat", isActive: true },
    { name: "Sesame", isActive: true },
  ];

  let allerCount = 0;
  const allergens = {};
  for (const all of allergenData) {
    const res = await Allergen.findOneAndUpdate(
      { name: all.name },
      { $set: all },
      { upsert: true, new: true },
    );
    allergens[all.name] = res._id;
    allerCount++;
  }
  logger.info(`Upserted ${allerCount} allergens`);

  // Food Items (20 items)
  const foodData = [
    {
      name: "Broccoli",
      categoryId: categories["Vegetables"],
      isVegan: true,
      nutritionPer100g: { calories: 34, protein: 2.8, fat: 0.4, carbs: 6.6, fiber: 2.6 },
    },
    {
      name: "Spinach",
      categoryId: categories["Vegetables"],
      isVegan: true,
      nutritionPer100g: { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 },
    },
    {
      name: "Carrot",
      categoryId: categories["Vegetables"],
      isVegan: true,
      nutritionPer100g: { calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, fiber: 2.8 },
    },
    {
      name: "Kale",
      categoryId: categories["Vegetables"],
      isVegan: true,
      nutritionPer100g: { calories: 35, protein: 2.9, fat: 1.5, carbs: 4.4, fiber: 4.1 },
    },
    {
      name: "Apple",
      categoryId: categories["Fruits"],
      isVegan: true,
      nutritionPer100g: { calories: 52, protein: 0.3, fat: 0.2, carbs: 13.8, fiber: 2.4 },
    },
    {
      name: "Banana",
      categoryId: categories["Fruits"],
      isVegan: true,
      nutritionPer100g: { calories: 89, protein: 1.1, fat: 0.3, carbs: 22.8, fiber: 2.6 },
    },
    {
      name: "Orange",
      categoryId: categories["Fruits"],
      isVegan: true,
      nutritionPer100g: { calories: 47, protein: 0.9, fat: 0.1, carbs: 11.8, fiber: 2.4 },
    },
    {
      name: "Blueberries",
      categoryId: categories["Fruits"],
      isVegan: true,
      nutritionPer100g: { calories: 57, protein: 0.7, fat: 0.3, carbs: 14.5, fiber: 2.4 },
    },
    {
      name: "Oats",
      categoryId: categories["Grains"],
      isVegan: true,
      nutritionPer100g: { calories: 389, protein: 16.9, fat: 6.9, carbs: 66.3, fiber: 10.6 },
    },
    {
      name: "Quinoa",
      categoryId: categories["Grains"],
      isVegan: true,
      nutritionPer100g: { calories: 368, protein: 14.1, fat: 6.1, carbs: 64.2, fiber: 7.0 },
    },
    {
      name: "Brown Rice",
      categoryId: categories["Grains"],
      isVegan: true,
      nutritionPer100g: { calories: 370, protein: 7.9, fat: 2.9, carbs: 77.2, fiber: 3.5 },
    },
    {
      name: "Lentils",
      categoryId: categories["Legumes"],
      isVegan: true,
      nutritionPer100g: { calories: 353, protein: 24.6, fat: 1.1, carbs: 63.4, fiber: 10.7 },
    },
    {
      name: "Chickpeas",
      categoryId: categories["Legumes"],
      isVegan: true,
      nutritionPer100g: { calories: 364, protein: 19.3, fat: 6.0, carbs: 60.6, fiber: 17.4 },
    },
    {
      name: "Black Beans",
      categoryId: categories["Legumes"],
      isVegan: true,
      nutritionPer100g: { calories: 341, protein: 21.6, fat: 1.4, carbs: 62.4, fiber: 15.5 },
    },
    {
      name: "Tofu",
      categoryId: categories["Legumes"],
      isVegan: true,
      allergenIds: [allergens["Soy"]],
      nutritionPer100g: { calories: 76, protein: 8.1, fat: 4.8, carbs: 1.9, fiber: 0.3 },
    },
    {
      name: "Almonds",
      categoryId: categories["Nuts & Seeds"],
      isVegan: true,
      allergenIds: [allergens["Tree Nuts"]],
      nutritionPer100g: { calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6, fiber: 12.5 },
    },
    {
      name: "Walnuts",
      categoryId: categories["Nuts & Seeds"],
      isVegan: true,
      allergenIds: [allergens["Tree Nuts"]],
      nutritionPer100g: { calories: 654, protein: 15.2, fat: 65.2, carbs: 13.7, fiber: 6.7 },
    },
    {
      name: "Chia Seeds",
      categoryId: categories["Nuts & Seeds"],
      isVegan: true,
      nutritionPer100g: { calories: 486, protein: 16.5, fat: 30.7, carbs: 42.1, fiber: 34.4 },
    },
    {
      name: "Flaxseeds",
      categoryId: categories["Nuts & Seeds"],
      isVegan: true,
      nutritionPer100g: { calories: 534, protein: 18.3, fat: 42.2, carbs: 28.9, fiber: 27.3 },
    },
    {
      name: "Peanut Butter",
      categoryId: categories["Nuts & Seeds"],
      isVegan: true,
      allergenIds: [allergens["Peanuts"]],
      nutritionPer100g: { calories: 588, protein: 25.1, fat: 50.4, carbs: 20.0, fiber: 6.0 },
    },
  ];

  let foodCount = 0;
  const foods = {};
  for (const food of foodData) {
    const res = await FoodItem.findOneAndUpdate(
      { name: food.name },
      { $set: { ...food, note: "Demo data" } },
      { upsert: true, new: true },
    );
    foods[food.name] = res;
    foodCount++;
  }
  logger.info(`Upserted ${foodCount} food items`);

  // Recipes (8 items)
  const recipeAuthor =
    (await User.findOne({ email: process.env.SEED_ADMIN_EMAIL })) || (await User.findOne());
  if (recipeAuthor) {
    const recipeData = [
      {
        title: "Oatmeal with Berries",
        slug: "oatmeal-with-berries",
        authorId: recipeAuthor._id,
        status: "published",
        visibility: "public",
        categoryId: categories["Breakfast"],
        difficulty: "easy",
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        servings: 1,
        ingredients: [
          { foodItemId: foods["Oats"]._id, name: "Oats", quantity: 50, unit: "g" },
          { foodItemId: foods["Blueberries"]._id, name: "Blueberries", quantity: 30, unit: "g" },
        ],
        steps: [
          { stepNumber: 1, instruction: "Boil oats." },
          { stepNumber: 2, instruction: "Add berries." },
        ],
        nutritionPerServing: { calories: 211, protein: 8.6, fat: 3.5, carbs: 37.5, fiber: 6.0 },
      },
      {
        title: "Tofu Scramble",
        slug: "tofu-scramble",
        authorId: recipeAuthor._id,
        status: "published",
        visibility: "public",
        categoryId: categories["Breakfast"],
        difficulty: "easy",
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        servings: 2,
        ingredients: [
          { foodItemId: foods["Tofu"]._id, name: "Tofu", quantity: 200, unit: "g" },
          { foodItemId: foods["Spinach"]._id, name: "Spinach", quantity: 50, unit: "g" },
        ],
        steps: [
          { stepNumber: 1, instruction: "Crumble tofu." },
          { stepNumber: 2, instruction: "Cook with spinach." },
        ],
        nutritionPerServing: { calories: 87, protein: 9.5, fat: 5.0, carbs: 3.7, fiber: 1.4 },
      },
      {
        title: "Lentil Soup",
        slug: "lentil-soup",
        authorId: recipeAuthor._id,
        status: "published",
        visibility: "public",
        categoryId: categories["Lunch"],
        difficulty: "medium",
        prepTimeMinutes: 15,
        cookTimeMinutes: 40,
        servings: 4,
        ingredients: [
          { foodItemId: foods["Lentils"]._id, name: "Lentils", quantity: 200, unit: "g" },
          { foodItemId: foods["Carrot"]._id, name: "Carrot", quantity: 100, unit: "g" },
        ],
        steps: [
          { stepNumber: 1, instruction: "Chop carrot." },
          { stepNumber: 2, instruction: "Boil lentils and carrot." },
        ],
        nutritionPerServing: { calories: 186, protein: 12.5, fat: 0.6, carbs: 34.1, fiber: 6.0 },
      },
      {
        title: "Quinoa Salad",
        slug: "quinoa-salad",
        authorId: recipeAuthor._id,
        status: "published",
        visibility: "public",
        categoryId: categories["Lunch"],
        difficulty: "easy",
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        servings: 2,
        ingredients: [
          { foodItemId: foods["Quinoa"]._id, name: "Quinoa", quantity: 100, unit: "g" },
          { foodItemId: foods["Broccoli"]._id, name: "Broccoli", quantity: 50, unit: "g" },
        ],
        steps: [
          { stepNumber: 1, instruction: "Cook quinoa." },
          { stepNumber: 2, instruction: "Mix with broccoli." },
        ],
        nutritionPerServing: { calories: 192, protein: 7.7, fat: 3.1, carbs: 33.7, fiber: 4.8 },
      },
      {
        title: "Black Bean Tacos",
        slug: "black-bean-tacos",
        authorId: recipeAuthor._id,
        status: "published",
        visibility: "public",
        categoryId: categories["Dinner"],
        difficulty: "easy",
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        servings: 3,
        ingredients: [
          { foodItemId: foods["Black Beans"]._id, name: "Black Beans", quantity: 150, unit: "g" },
        ],
        steps: [
          { stepNumber: 1, instruction: "Warm beans." },
          { stepNumber: 2, instruction: "Serve in tacos." },
        ],
        nutritionPerServing: { calories: 170, protein: 10.8, fat: 0.7, carbs: 31.2, fiber: 7.7 },
      },
      {
        title: "Chickpea Curry",
        slug: "chickpea-curry",
        authorId: recipeAuthor._id,
        status: "published",
        visibility: "public",
        categoryId: categories["Dinner"],
        difficulty: "medium",
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        servings: 4,
        ingredients: [
          { foodItemId: foods["Chickpeas"]._id, name: "Chickpeas", quantity: 250, unit: "g" },
        ],
        steps: [{ stepNumber: 1, instruction: "Cook chickpeas with curry spices." }],
        nutritionPerServing: { calories: 227, protein: 12.0, fat: 3.7, carbs: 37.8, fiber: 10.8 },
      },
      {
        title: "Apple Peanut Butter Snack",
        slug: "apple-peanut-butter-snack",
        authorId: recipeAuthor._id,
        status: "published",
        visibility: "public",
        categoryId: categories["Snack"],
        difficulty: "easy",
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 1,
        ingredients: [
          { foodItemId: foods["Apple"]._id, name: "Apple", quantity: 100, unit: "g" },
          {
            foodItemId: foods["Peanut Butter"]._id,
            name: "Peanut Butter",
            quantity: 20,
            unit: "g",
          },
        ],
        steps: [
          { stepNumber: 1, instruction: "Slice apple." },
          { stepNumber: 2, instruction: "Dip in peanut butter." },
        ],
        nutritionPerServing: { calories: 169, protein: 5.3, fat: 10.2, carbs: 17.8, fiber: 3.6 },
      },
      {
        title: "Banana Smoothie",
        slug: "banana-smoothie",
        authorId: recipeAuthor._id,
        status: "published",
        visibility: "public",
        categoryId: categories["Snack"],
        difficulty: "easy",
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 1,
        ingredients: [
          { foodItemId: foods["Banana"]._id, name: "Banana", quantity: 100, unit: "g" },
          { foodItemId: foods["Chia Seeds"]._id, name: "Chia Seeds", quantity: 10, unit: "g" },
        ],
        steps: [
          { stepNumber: 1, instruction: "Blend banana and chia seeds with water or plant milk." },
        ],
        nutritionPerServing: { calories: 137, protein: 2.7, fat: 3.3, carbs: 27.0, fiber: 6.0 },
      },
    ];

    let recipeCount = 0;
    for (const recipe of recipeData) {
      await Recipe.findOneAndUpdate({ slug: recipe.slug }, { $set: recipe }, { upsert: true });
      recipeCount++;
    }
    logger.info(`Upserted ${recipeCount} recipes`);
  } else {
    logger.warn("No author found for recipes, skipping recipe seed.");
  }

  logger.info("Seed completed successfully!");
  process.exit(0);
};

runSeed().catch((err) => {
  logger.error("Seed failed:", err);
  process.exit(1);
});
