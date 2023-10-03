import type { z } from "zod";
import { trpc } from "./app/_trpc/client";
import ingredients from "./data/ingredients.json";
import {
  AppEventSchema,
  CookingTimeSchema,
  CookwareSchema,
  CreateRecipeInputSchema,
  CuisineSchema,
  DishTypeSchema,
  RecipeAttributeSchema,
  RecipeAttributesSchema,
  RecipeSchema,
  TechniqueSchema,
} from "./schema";

export type AppEvent = z.infer<typeof AppEventSchema>;

export type Ingredient = (typeof ingredients)[0];

export type Recipe = z.infer<typeof RecipeSchema>;
export type DishType = z.infer<typeof DishTypeSchema>;
export type CookingTime = z.infer<typeof CookingTimeSchema>;
export type Cookware = z.infer<typeof CookwareSchema>;
export type Technique = z.infer<typeof TechniqueSchema>;
export type Cuisine = z.infer<typeof CuisineSchema>;

export type RecipeAttributes = z.infer<typeof RecipeAttributesSchema>;
export type RecipeAttribute = z.infer<typeof RecipeAttributeSchema>;

export type AppClient = ReturnType<typeof trpc.useContext>["client"];

export type CreateRecipeInput = z.infer<typeof CreateRecipeInputSchema>;