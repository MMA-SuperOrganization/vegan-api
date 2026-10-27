# Open catalog attribution

`open-catalog.json` is a generated data snapshot. It combines:

- Nutrition and food records from **USDA FoodData Central**, public domain under CC0 1.0. Source: https://fdc.nal.usda.gov/
- Vegan-tagged recipes from **ForkRecipe**, revision `934319313379201f91ddccdd29abd054039a3ad6`, licensed CC BY-SA 4.0. Source: https://github.com/futurechef/forkrecipe-recipes

The importer preserves source, source ID, URL, licence, and import timestamp on every imported record. Recipes are filtered conservatively: the source must tag the recipe as vegan and its ingredient list must not contain known animal-derived ingredients.

Do not remove attribution when redistributing imported recipe content. Adapted ForkRecipe recipe content remains subject to CC BY-SA 4.0.
