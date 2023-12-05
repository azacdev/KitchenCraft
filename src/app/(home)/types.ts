import { Recipe } from "@/types";
import { MapStore } from "nanostores";
import { z } from "zod";
import { TabSchema, TimeParamSchema } from "./schema";

export type RecipeStore = MapStore<{
  error: undefined | string;
  loading: boolean;
  data: Recipe[];
}>;

export type Tab = z.infer<typeof TabSchema>;
export type TimeParam = z.infer<typeof TimeParamSchema>;
export type HomeStore = MapStore<{ tab: Tab; timeParam?: TimeParam }>;
