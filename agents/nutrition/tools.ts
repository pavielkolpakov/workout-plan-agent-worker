import { z } from "zod";
import { tool } from "ai";
import {
  MacrosSchema,
  MacroSplitSchema,
  MealPlanSchema,
  HydrationPlanSchema,
} from "./schemas";

/**
 * Nutrition Agent Tools
 * Tools for multi-step nutrition plan generation
 */

export const calculateCaloriesTool = tool({
  description:
    "Calculate daily calorie needs based on user profile, goals, and training program",
  inputSchema: z.object({
    dailyCalories: z.number().min(1200).max(5000),
    calculationBasis: z
      .string()
      .describe("Brief explanation of how calories were calculated"),
  }),
  execute: async ({ dailyCalories, calculationBasis }) => {
    console.log("[Nutrition Tool] calculateCalories:", dailyCalories, "kcal");
    return { dailyCalories, calculationBasis };
  },
});

export const distributeMacrosTool = tool({
  description:
    "Distribute macronutrients (protein, carbs, fats) based on fitness goal",
  inputSchema: z.object({
    macros: MacrosSchema,
    macroSplit: MacroSplitSchema,
    reasoning: z.string().describe("Explanation for macro distribution choice"),
  }),
  execute: async ({ macros, macroSplit, reasoning }) => {
    console.log("[Nutrition Tool] distributeMacros:", macros);
    return { macros, macroSplit, reasoning };
  },
});

export const createMealPlanTool = tool({
  description:
    "Create meal timing and calorie distribution based on training schedule and lifestyle",
  inputSchema: z.object({
    mealPlan: MealPlanSchema,
    reasoning: z
      .string()
      .describe("Explanation for meal timing and distribution"),
  }),
  execute: async ({ mealPlan, reasoning }) => {
    console.log(
      "[Nutrition Tool] createMealPlan: 3 meals +",
      mealPlan.snacks?.length || 0,
      "snacks"
    );
    return { mealPlan, reasoning };
  },
});

export const addHydrationPlanTool = tool({
  description:
    "Add hydration recommendations based on activity level and goals",
  inputSchema: z.object({
    hydration: HydrationPlanSchema,
  }),
  execute: async ({ hydration }) => {
    console.log(
      "[Nutrition Tool] addHydrationPlan:",
      hydration.dailyWater_liters,
      "L"
    );
    return { hydration };
  },
});

export const nutritionProgramTools = {
  calculateCalories: calculateCaloriesTool,
  distributeMacros: distributeMacrosTool,
  createMealPlan: createMealPlanTool,
  addHydrationPlan: addHydrationPlanTool,
};

export enum NutritionToolName {
  CalculateCalories = "calculateCalories",
  DistributeMacros = "distributeMacros",
  CreateMealPlan = "createMealPlan",
  AddHydrationPlan = "addHydrationPlan",
}
