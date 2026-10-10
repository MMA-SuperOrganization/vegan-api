const unsplash = (photoId) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`;

const categoryImages = {
  Vegetables: unsplash("photo-1566385101042-1a0aa0c1268c"),
  Fruits: unsplash("photo-1610832958506-aa56368176cf"),
  Grains: unsplash("photo-1586201375761-83865001e31c"),
  Legumes: unsplash("photo-1515543904379-3d757afe72e4"),
  "Nuts & Seeds": unsplash("photo-1599599810769-bcde5a160d32"),
};

export const foodImageUrl = (category) => categoryImages[category];

// name, category, kcal, protein, fat, carbohydrate, fibre, optional allergen
export const EXTRA_FOOD_ROWS = [
  ["Sweet Potato", "Vegetables", 86, 1.6, 0.1, 20.1, 3],
  ["Tomato", "Vegetables", 18, 0.9, 0.2, 3.9, 1.2],
  ["Cucumber", "Vegetables", 15, 0.7, 0.1, 3.6, 0.5],
  ["Mushroom", "Vegetables", 22, 3.1, 0.3, 3.3, 1],
  ["Bell Pepper", "Vegetables", 31, 1, 0.3, 6, 2.1],
  ["Avocado", "Fruits", 160, 2, 14.7, 8.5, 6.7],
  ["Green Peas", "Legumes", 81, 5.4, 0.4, 14.5, 5.1],
  ["Cauliflower", "Vegetables", 25, 1.9, 0.3, 5, 2],
  ["Zucchini", "Vegetables", 17, 1.2, 0.3, 3.1, 1],
  ["Pumpkin", "Vegetables", 26, 1, 0.1, 6.5, 0.5],
  ["Tempeh", "Legumes", 193, 20.3, 10.8, 7.6, 1.4, "Soy"],
  ["Edamame", "Legumes", 121, 11.9, 5.2, 8.9, 5.2, "Soy"],
  ["Coconut Milk", "Fruits", 230, 2.3, 23.8, 5.5, 2.2],
  ["Cashews", "Nuts & Seeds", 553, 18.2, 43.8, 30.2, 3.3, "Tree Nuts"],
  ["Sesame Seeds", "Nuts & Seeds", 573, 17.7, 49.7, 23.4, 11.8, "Sesame"],
  ["Whole Wheat Pasta", "Grains", 348, 14.6, 2.5, 70.7, 10.7, "Wheat"],
  ["Rice Noodles", "Grains", 364, 5.9, 0.6, 80.2, 1.6],
  ["Kidney Beans", "Legumes", 333, 23.6, 0.8, 60, 24.9],
  ["Corn", "Grains", 86, 3.3, 1.4, 19, 2],
  ["Lime", "Fruits", 30, 0.7, 0.2, 10.5, 2.8],
];

const recipeImages = [
  "photo-1512621776951-a57141f2eefd",
  "photo-1540420773420-3366772f4999",
  "photo-1547592180-85f173990554",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1473093295043-cdd812d0e601",
  "photo-1490645935967-10de6ba17061",
  "photo-1498837167922-ddd27525d352",
  "photo-1528712306091-ed0763094c98",
];

export const recipeImageUrl = (index) => unsplash(recipeImages[index % recipeImages.length]);

export const EXTRA_RECIPE_ROWS = [
  [
    "Mushroom Tofu Stir Fry",
    "Dinner",
    "easy",
    12,
    15,
    2,
    [
      ["Tofu", 250],
      ["Mushroom", 150],
      ["Bell Pepper", 100],
    ],
    [
      "Slice the tofu, mushrooms and bell pepper.",
      { instruction: "Stir fry until the vegetables are tender.", timerSeconds: 600 },
    ],
  ],
  [
    "Sweet Potato Chickpea Bowl",
    "Lunch",
    "easy",
    15,
    25,
    2,
    [
      ["Sweet Potato", 300],
      ["Chickpeas", 180],
      ["Spinach", 80],
    ],
    [
      "Cut the sweet potato into small cubes.",
      { instruction: "Roast the sweet potato until tender.", timerSeconds: 1200 },
      "Serve with chickpeas and spinach.",
    ],
  ],
  [
    "Creamy Pumpkin Soup",
    "Dinner",
    "easy",
    10,
    30,
    4,
    [
      ["Pumpkin", 500],
      ["Coconut Milk", 150],
      ["Carrot", 100],
    ],
    [
      "Dice the pumpkin and carrot.",
      { instruction: "Simmer the vegetables until soft.", timerSeconds: 1200 },
      "Blend with coconut milk until smooth.",
    ],
  ],
  [
    "Tempeh Vegetable Bowl",
    "Lunch",
    "medium",
    15,
    20,
    2,
    [
      ["Tempeh", 200],
      ["Brown Rice", 160],
      ["Broccoli", 120],
    ],
    [
      "Steam the broccoli and prepare the rice.",
      { instruction: "Pan sear the tempeh until golden.", timerSeconds: 600 },
      "Arrange everything in serving bowls.",
    ],
  ],
  [
    "Green Pea Soup",
    "Lunch",
    "easy",
    10,
    20,
    3,
    [
      ["Green Peas", 350],
      ["Zucchini", 150],
      ["Spinach", 80],
    ],
    [
      { instruction: "Simmer the peas and zucchini until tender.", timerSeconds: 900 },
      "Add spinach and blend until smooth.",
    ],
  ],
  [
    "Lentil Mushroom Pasta",
    "Dinner",
    "medium",
    15,
    25,
    4,
    [
      ["Whole Wheat Pasta", 280],
      ["Lentils", 180],
      ["Mushroom", 180],
      ["Tomato", 200],
    ],
    [
      "Cook the pasta according to its package instructions.",
      "Cook the mushrooms, tomato and lentils into a sauce.",
      "Combine the pasta and sauce before serving.",
    ],
  ],
  [
    "Avocado Chickpea Salad",
    "Lunch",
    "easy",
    12,
    0,
    2,
    [
      ["Avocado", 150],
      ["Chickpeas", 180],
      ["Cucumber", 120],
      ["Tomato", 120],
      ["Lime", 30],
    ],
    ["Dice the vegetables and avocado.", "Toss with chickpeas and lime juice."],
  ],
  [
    "Cauliflower Quinoa Bowl",
    "Dinner",
    "easy",
    15,
    25,
    3,
    [
      ["Cauliflower", 300],
      ["Quinoa", 180],
      ["Kale", 120],
    ],
    [
      "Prepare the quinoa.",
      { instruction: "Roast the cauliflower until browned.", timerSeconds: 1200 },
      "Serve with kale and quinoa.",
    ],
  ],
  [
    "Edamame Brown Rice Bowl",
    "Lunch",
    "easy",
    10,
    20,
    2,
    [
      ["Edamame", 180],
      ["Brown Rice", 180],
      ["Carrot", 100],
      ["Cucumber", 100],
    ],
    ["Prepare the rice and edamame.", "Arrange with sliced carrot and cucumber."],
  ],
  [
    "Cashew Broccoli Stir Fry",
    "Dinner",
    "easy",
    10,
    15,
    2,
    [
      ["Cashews", 60],
      ["Broccoli", 250],
      ["Bell Pepper", 120],
    ],
    [
      "Chop the broccoli and bell pepper.",
      { instruction: "Stir fry the vegetables and cashews.", timerSeconds: 600 },
    ],
  ],
  [
    "Sesame Tofu Rice Noodles",
    "Dinner",
    "medium",
    15,
    20,
    3,
    [
      ["Rice Noodles", 240],
      ["Tofu", 240],
      ["Sesame Seeds", 25],
      ["Zucchini", 150],
    ],
    [
      "Prepare the rice noodles.",
      "Cook the tofu and zucchini.",
      "Combine and finish with sesame seeds.",
    ],
  ],
  [
    "Black Bean Corn Salad",
    "Lunch",
    "easy",
    10,
    0,
    3,
    [
      ["Black Beans", 220],
      ["Corn", 160],
      ["Tomato", 150],
      ["Avocado", 120],
      ["Lime", 30],
    ],
    ["Drain the beans and prepare the vegetables.", "Toss everything with lime juice."],
  ],
];
