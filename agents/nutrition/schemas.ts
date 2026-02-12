import { z } from "zod";

/**
 * Nutrition Plan Schemas
 * Defines the structure for personalized nutrition plans
 */

export const MacrosSchema = z.object({
  protein_g: z.number().min(0).describe("Daily protein in grams"),
  carbs_g: z.number().min(0).describe("Daily carbohydrates in grams"),
  fats_g: z.number().min(0).describe("Daily fats in grams"),
});

export const MacroSplitSchema = z.object({
  protein_percent: z
    .number()
    .min(10)
    .max(50)
    .describe("Protein percentage (10-50%)"),
  carbs_percent: z
    .number()
    .min(20)
    .max(65)
    .describe("Carbs percentage (20-65%)"),
  fats_percent: z.number().min(15).max(40).describe("Fats percentage (15-40%)"),
});

export const MealSchema = z.object({
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .describe('Meal time in HH:MM format (e.g., "08:00")'),
  calories: z.number().min(0).describe("Calories for this meal"),
  macros: MacrosSchema.describe("Macro distribution for this meal"),
  description: z
    .string()
    .nullish()
    .describe("Brief description or suggestions for the meal"),
});

export const SnackSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  calories: z.number().min(0),
  description: z.string().nullish(),
});

export const MealPlanSchema = z.object({
  breakfast: MealSchema.describe("Breakfast meal details"),
  lunch: MealSchema.describe("Lunch meal details"),
  dinner: MealSchema.describe("Dinner meal details"),
  snacks: z
    .array(SnackSchema)
    .nullish()
    .describe("Optional snacks throughout the day"),
});

export const HydrationPlanSchema = z.object({
  dailyWater_liters: z
    .number()
    .min(1.5)
    .max(5)
    .describe("Daily water intake in liters (1.5-5L)"),
  recommendations: z
    .string()
    .describe("Hydration recommendations and timing tips"),
});

/**
 * Daily Nutrition Adjustment Schema
 * Day-specific adjustments based on workout activity type
 */
export const DailyNutritionAdjustmentSchema = z.object({
  dayNumber: z.number().min(1).max(7).describe("Day of the week (1-7)"),
  weekNumber: z
    .number()
    .min(1)
    .nullish()
    .describe("Week number in program (optional)"),
  activityType: z.string().describe("Type of workout activity for this day"),

  calorieAdjustment: z
    .number()
    .describe("Calorie adjustment from baseline (±calories)"),
  macroEmphasis: z
    .string()
    .nullish()
    .describe('Macro emphasis for this day (e.g., "Protein focus: 180g")'),
  mealTimingNotes: z
    .string()
    .nullish()
    .describe("Pre/post workout meal timing suggestions"),

  reasoning: z
    .string()
    .describe("Explanation why these adjustments are recommended"),
});

/**
 * Baseline Nutrition Plan Schema
 * Core nutrition plan that can be used standalone
 */
const BaselineNutritionSchema = z.object({
  dailyCalories: z
    .number()
    .min(1200)
    .max(5000)
    .describe("Baseline daily calorie target (1200-5000 kcal)"),
  macros: MacrosSchema.describe("Baseline daily macro targets in grams"),
  macroSplit: MacroSplitSchema.describe(
    "Baseline macro distribution as percentages"
  ),
  mealPlan: MealPlanSchema.describe(
    "Baseline daily meal timing and distribution"
  ),
  hydration: HydrationPlanSchema.nullish().describe("Baseline hydration plan"),
});

/**
 * Complete Nutrition Plan Schema
 * Baseline plan + optional daily adjustments based on workout program
 */
export const NutritionPlanSchema = z.object({
  // Baseline plan (can be used standalone, outside workout program)
  baseline: BaselineNutritionSchema.describe(
    "Core nutrition plan, can be used independently"
  ),

  // Daily adjustments (generated when workout program is available)
  dailyAdjustments: z
    .array(DailyNutritionAdjustmentSchema)
    .nullish()
    .describe(
      "Day-specific nutrition adjustments based on workout activity types"
    ),

  // General notes
  notes: z
    .string()
    .nullish()
    .describe("Additional nutrition notes or recommendations"),
});

export type Macros = z.infer<typeof MacrosSchema>;
export type MacroSplit = z.infer<typeof MacroSplitSchema>;
export type Meal = z.infer<typeof MealSchema>;
export type Snack = z.infer<typeof SnackSchema>;
export type MealPlan = z.infer<typeof MealPlanSchema>;
export type HydrationPlan = z.infer<typeof HydrationPlanSchema>;
export type DailyNutritionAdjustment = z.infer<
  typeof DailyNutritionAdjustmentSchema
>;
export type BaselineNutrition = z.infer<typeof BaselineNutritionSchema>;
export type NutritionPlan = z.infer<typeof NutritionPlanSchema>;
