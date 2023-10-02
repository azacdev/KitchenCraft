import { z } from "zod";
import {
  COOKING_TIMES,
  COOKWARES,
  CUISINES,
  DISH_TYPES,
  TECHNIQUES,
} from "./constants";

export const AppEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SELECT_RECIPE"),
    name: z.string(),
    description: z.string(),
  }),

  z.object({
    type: z.literal("INIT"),
  }),
]);

// TypeScript Type Literals
export const DishTypeSchema = z.enum(DISH_TYPES);
export const CookingTimeSchema = z.enum(COOKING_TIMES);
export const CookwareSchema = z.enum(COOKWARES);
export const TechniqueSchema = z.enum(TECHNIQUES);
export const CuisineSchema = z.enum(CUISINES);

const RecipeDetailsSchema = z.object({
  name: z.string(),
  ingredients: z.array(
    z.object({
      ingredient: z.string(),
      quantity: z.string(),
    })
  ),
  instructions: z.array(z.string()),
  preparationTime: z.string(),
  cookingTime: z.string(),
  serves: z.string(),
});

const NutritionFactsSchema = z.object({
  calories: z.number(),
  carbohydrates: z.number(),
  proteins: z.number(),
  fats: z.number(),
  saturatedFats: z.number().optional(),
  sugars: z.number().optional(),
  dietaryFiber: z.number().optional(),
});

export const FullRecipeSchema = z.object({
  details: RecipeDetailsSchema,
  nutritionFacts: NutritionFactsSchema,
});

export const RecipeAttributesSchema = z.object({
  prompt: z.string().optional(),
  ingredients: z.record(z.boolean()),
  techniques: z.record(z.boolean()),
  cuisines: z.record(z.boolean()),
  cookware: z.record(z.boolean()),
  dishType: DishTypeSchema.optional(),
  cookingTime: CookingTimeSchema.optional(),
});

export const RecipeAttributeSchema = RecipeAttributesSchema.keyof();

export const RecipeSchema = z.object({
  name: z.string(),
});