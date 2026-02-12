import { z } from "zod";
import { WorkoutProgramSchema } from "../workout-program/schemas";
import { NutritionPlanSchema } from "../nutrition/schemas";
import { SleepScheduleSchema } from "../sleep/schemas";
import { StepsTargetSchema } from "../steps/schemas";

/**
 * Complete Fitness Program Schema
 * Combines all program components into one comprehensive plan
 */

export const CompleteFitnessProgramSchema = z.object({
  workout: WorkoutProgramSchema.describe("Multi-week training program"),
  nutrition: NutritionPlanSchema.describe(
    "Daily nutrition plan with meals and macros"
  ),
  sleep: SleepScheduleSchema.describe("Sleep schedule optimized for recovery"),
  steps: StepsTargetSchema.describe("Daily steps target and recommendations"),
  generatedAt: z.string().describe("ISO timestamp of generation"),
  version: z.string().default("1.0").describe("Program version"),
});

export type CompleteFitnessProgram = z.infer<
  typeof CompleteFitnessProgramSchema
>;

// Re-export component schemas for convenience
export { WorkoutProgramSchema } from "../workout-program/schemas";
export { NutritionPlanSchema } from "../nutrition/schemas";
export { SleepScheduleSchema } from "../sleep/schemas";
export { StepsTargetSchema } from "../steps/schemas";
