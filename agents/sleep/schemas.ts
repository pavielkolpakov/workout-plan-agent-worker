import { z } from "zod";

/**
 * Sleep Schedule Schemas
 * Defines the structure for personalized sleep recommendations
 */

/**
 * Basic sleep schedule structure
 */
const SleepDayScheduleSchema = z.object({
  bedtime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .describe('Bedtime in HH:MM format (24-hour, e.g., "22:30")'),
  wakeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .describe('Wake time in HH:MM format (24-hour, e.g., "06:30")'),
  duration_minutes: z
    .number()
    .min(360)
    .max(600)
    .describe("Planned sleep duration in minutes (6-10 hours)"),
});

/**
 * Daily Sleep Adjustment Schema
 * Day-specific sleep adjustments based on workout intensity
 */
export const DailySleepAdjustmentSchema = z.object({
  dayNumber: z.number().min(1).max(7).describe("Day of the week (1-7)"),
  weekNumber: z
    .number()
    .min(1)
    .nullish()
    .describe("Week number in program (optional)"),
  activityType: z.string().describe("Type of workout activity for this day"),

  bedtime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .nullish()
    .describe("Adjusted bedtime for this activity"),
  wakeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .nullish()
    .describe("Adjusted wake time for this activity"),
  duration_minutes: z
    .number()
    .min(360)
    .max(600)
    .nullish()
    .describe("Adjusted sleep duration for this activity"),

  reasoning: z
    .string()
    .describe("Explanation why these sleep adjustments are recommended"),
});

/**
 * Baseline Sleep Schedule Schema
 * Core sleep schedule that can be used standalone
 */
const BaselineSleepScheduleSchema = z.object({
  bedtime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .describe("Baseline bedtime"),
  wakeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .describe("Baseline wake time"),
  duration_minutes: z
    .number()
    .min(360)
    .max(600)
    .describe("Baseline sleep duration in minutes"),
});

/**
 * Complete Sleep Schedule Schema
 * Baseline schedule + optional daily adjustments based on workout program
 */
export const SleepScheduleSchema = z.object({
  // Baseline schedule (can be used standalone, outside workout program)
  baseline: BaselineSleepScheduleSchema.describe(
    "Core sleep schedule, can be used independently"
  ),

  // Daily adjustments (generated when workout program is available)
  dailyAdjustments: z
    .array(DailySleepAdjustmentSchema)
    .nullish()
    .describe(
      "Day-specific sleep adjustments based on workout intensity and recovery needs"
    ),

  timezone: z
    .string()
    .describe('Timezone (e.g., "America/New_York", "Europe/Kiev")'),
  recommendations: z
    .array(z.string())
    .min(3)
    .describe(
      "Practical sleep optimization tips and recommendations (AI decides how many based on context)"
    ),
  notes: z.string().nullish().describe("Additional notes about sleep schedule"),
});

export type SleepDaySchedule = z.infer<typeof SleepDayScheduleSchema>;
export type DailySleepAdjustment = z.infer<typeof DailySleepAdjustmentSchema>;
export type BaselineSleepSchedule = z.infer<typeof BaselineSleepScheduleSchema>;
export type SleepSchedule = z.infer<typeof SleepScheduleSchema>;
