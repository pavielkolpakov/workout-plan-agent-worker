import { z } from "zod";

/**
 * Steps Target Schemas
 * Defines the structure for daily steps recommendations
 *
 * IMPORTANT: We use separate schemas for AI generation vs. final output:
 * - StepsTargetSchemaForAI: Used by AI (no weeklyTarget - avoids null issues)
 * - StepsTargetSchema: Final type with weeklyTarget (computed by generator)
 */

/**
 * Daily Steps Adjustment Schema
 * Day-specific steps targets based on workout activity type
 */
export const DailyStepsAdjustmentSchema = z.object({
  dayNumber: z.number().min(1).max(7).describe("Day of the week (1-7)"),
  weekNumber: z
    .number()
    .min(1)
    .nullish()
    .describe("Week number in program (optional)"),
  activityType: z.string().describe("Type of workout activity for this day"),

  stepsTarget: z
    .number()
    .min(3000)
    .max(25000)
    .describe("Adjusted steps target for this activity type"),
  adjustment: z.number().describe("Difference from baseline steps goal"),

  reasoning: z
    .string()
    .describe("Explanation why this steps target is recommended"),
});

/**
 * Baseline Steps Target Schema (AI output).
 * weeklyTarget will be computed by generator after parsing (dailyStepsGoal * 7)
 */
const BaselineStepsTargetSchemaForAI = z.object({
  dailyStepsGoal: z
    .number()
    .min(3000)
    .max(25000)
    .describe("Baseline daily steps target (3,000-25,000 steps)"),
});

/**
 * Baseline Steps Target Schema (full version with weeklyTarget)
 * Used for type inference - weeklyTarget is added by generator
 */
const BaselineStepsTargetSchema = z.object({
  dailyStepsGoal: z.number().min(3000).max(25000),
  weeklyTarget: z.number(),
});

/**
 * Complete Steps Target Schema (for AI generation)
 * Baseline target + optional daily adjustments
 * weeklyTarget is NOT requested from AI - will be computed after parsing
 */
export const StepsTargetSchemaForAI = z.object({
  baseline: BaselineStepsTargetSchemaForAI.describe(
    "Core steps target - only dailyStepsGoal is required"
  ),
  dailyAdjustments: z
    .array(DailyStepsAdjustmentSchema)
    .nullish()
    .describe(
      "Day-specific steps adjustments based on workout activity and recovery needs"
    ),
  reasoning: z
    .string()
    .describe(
      "Overall explanation for the steps target based on user profile and goals"
    ),
  tips: z
    .array(z.string())
    .nullish()
    .describe("Practical tips for achieving daily steps goal"),
});

/**
 * Complete Steps Target Schema (with weeklyTarget added)
 * Used for type inference after generator adds weeklyTarget
 */
export const StepsTargetSchema = z.object({
  baseline: BaselineStepsTargetSchema,
  dailyAdjustments: z.array(DailyStepsAdjustmentSchema).nullish(),
  reasoning: z.string(),
  tips: z.array(z.string()).nullish(),
});

export type DailyStepsAdjustment = z.infer<typeof DailyStepsAdjustmentSchema>;
export type BaselineStepsTarget = z.infer<typeof BaselineStepsTargetSchema>;
export type StepsTarget = z.infer<typeof StepsTargetSchema>;
