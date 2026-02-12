import { z } from "zod";

import { ACTIVITY_TYPES } from "../../types/questionnaire";

/**
 * Workout Program Schemas
 * Shared schemas for AI workout program generation
 * Based on docs/workouts/schemas/ structure with blocks and 11 exercise types
 */

// ============= EXERCISE SCHEMAS (11 types) =============

// Base Exercise Schema (common fields for all exercise types)
const BaseExerciseSchema = z.object({
  id: z
    .string()
    .describe('Unique identifier for the exercise (e.g., "ex_squat_1")'),
  title: z.string().describe("Human-readable name of the exercise"),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .nullish()
    .describe("Difficulty level"),
  notes: z.string().nullish().describe("Additional notes or instructions"),
});

// 1. Strength Set Exercise (also used for stretching/mobility in warmup/cooldown)
const StrengthSetExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("strength-set"),
  // For strength exercises:
  sets: z
    .number()
    .min(1)
    .max(10)
    .nullish()
    .describe(
      "Number of sets (required for strength, optional for stretching)"
    ),
  reps: z
    .string()
    .nullish()
    .describe(
      'Repetitions (e.g., "8-12", "10", "AMRAP") - required for strength, optional for stretching'
    ),
  weight_kg: z.number().min(0).nullish().describe("Weight in kilograms"),
  rest_sec: z
    .number()
    .min(0)
    .nullish()
    .describe(
      "Rest time between sets in seconds (required for strength, optional for stretching)"
    ),
  muscleGroups: z
    .array(z.string())
    .nullish()
    .describe(
      "Target muscle groups (required for strength, optional for stretching)"
    ),
  equipment: z.array(z.string()).nullish().describe("Required equipment"),
  formCues: z.array(z.string()).nullish().describe("Form cues and tips"),
  superset_group: z
    .string()
    .nullish()
    .describe(
      'Superset group ID (e.g., "A", "B", "C"). ' +
        "Exercises with SAME group ID are performed as a superset (alternating sets with minimal rest). " +
        "First exercise in superset should have rest_sec=0, last exercise rest_sec=90-120. " +
        "REQUIRED when trainingDuration ≤45min and based on intensity score. " +
        "Common pairings: antagonist muscles (chest+back, biceps+triceps), " +
        "upper+lower (glutes+shoulders, chest+legs), " +
        "or circuit style (3-4 exercises in sequence). " +
        'Example: Two exercises with superset_group="A" form one superset pair.'
    ),
  progression_notes: z
    .string()
    .nullish()
    .describe(
      "Notes about weight/intensity progression compared to previous weeks. " +
        'Example: "Increased weight from 60kg to 63kg (5% progression)" or "Added 1 set for volume increase"'
    ),
  // For stretching/mobility exercises (in warmup/cooldown):
  duration_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Hold duration in seconds (for stretching/mobility)"),
  breathing: z
    .string()
    .nullish()
    .describe(
      "Breathing pattern - AI can suggest any breathing technique appropriate for the exercise"
    ),
  media_url: z
    .string()
    .nullish()
    .describe("URL to exercise demonstration video"),
});

// 2. Cardio Steady Running
const CardioSteadyRunningSchema = BaseExerciseSchema.extend({
  type: z.literal("cardio-steady-running"),
  target_distance_m: z
    .number()
    .min(0)
    .nullish()
    .describe("Target distance in meters"),
  duration_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Target duration in seconds"),
  target_pace_sec_per_km: z
    .number()
    .min(0)
    .nullish()
    .describe("Target pace in seconds per kilometer"),
  location: z
    .enum(["outdoor", "treadmill"])
    .nullish()
    .describe("Running location"),
});

// 3. Cardio Steady Walking
const CardioSteadyWalkingSchema = BaseExerciseSchema.extend({
  type: z.literal("cardio-steady-walking"),
  target_distance_m: z
    .number()
    .min(0)
    .nullish()
    .describe("Target distance in meters"),
  duration_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Target duration in seconds"),
  target_pace_sec_per_km: z
    .number()
    .min(0)
    .nullish()
    .describe("Target pace in seconds per kilometer"),
});

// 4. Cardio Steady Cycling Outdoor
const CardioSteadyCyclingOutdoorSchema = BaseExerciseSchema.extend({
  type: z.literal("cardio-steady-cycling-outdoor"),
  target_distance_m: z
    .number()
    .min(0)
    .nullish()
    .describe("Target distance in meters"),
  duration_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Target duration in seconds"),
  target_speed_kmh: z
    .number()
    .min(0)
    .nullish()
    .describe("Target speed in km/h"),
  terrain: z.enum(["flat", "hilly"]).nullish().describe("Terrain type"),
});

// 5. Cardio Steady Cycling Indoor
const CardioSteadyCyclingIndoorSchema = BaseExerciseSchema.extend({
  type: z.literal("cardio-steady-cycling-indoor"),
  duration_sec: z.number().min(0).describe("Duration in seconds"),
  target_speed_kmh: z
    .number()
    .min(0)
    .nullish()
    .describe("Target speed in km/h"),
  resistance_level: z
    .number()
    .min(1)
    .max(20)
    .nullish()
    .describe("Resistance level"),
});

// 6. Cardio Steady Elliptical
const CardioSteadyEllipticalSchema = BaseExerciseSchema.extend({
  type: z.literal("cardio-steady-elliptical"),
  duration_sec: z.number().min(0).describe("Duration in seconds"),
  resistance_level: z
    .number()
    .min(1)
    .max(20)
    .nullish()
    .describe("Resistance level"),
  target_spm: z.number().min(0).nullish().describe("Target strides per minute"),
});

// 7. Cardio Steady Rowing
const CardioSteadyRowingSchema = BaseExerciseSchema.extend({
  type: z.literal("cardio-steady-rowing"),
  target_distance_m: z
    .number()
    .min(0)
    .nullish()
    .describe("Target distance in meters"),
  duration_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Target duration in seconds"),
  target_pace_sec_per_500m: z
    .number()
    .min(0)
    .nullish()
    .describe("Target split pace (seconds per 500m)"),
  stroke_rate: z
    .number()
    .min(0)
    .nullish()
    .describe("Target strokes per minute"),
});

// 8. Cardio Steady Hiking
const CardioSteadyHikingSchema = BaseExerciseSchema.extend({
  type: z.literal("cardio-steady-hiking"),
  target_distance_m: z
    .number()
    .min(0)
    .nullish()
    .describe("Target distance in meters"),
  duration_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Target duration in seconds"),
  elevation_gain_m: z
    .number()
    .min(0)
    .nullish()
    .describe("Target elevation gain in meters"),
});

// 9. Cardio Interval (HIIT or continuous warmup cardio)
const CardioIntervalSchema = BaseExerciseSchema.extend({
  type: z.literal("cardio-interval"),
  // For HIIT/interval work:
  work_sec: z
    .number()
    .min(1)
    .nullish()
    .describe("Work period duration in seconds (for interval training)"),
  rest_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Rest period duration in seconds"),
  rounds: z
    .number()
    .min(1)
    .nullish()
    .describe("Number of rounds (for interval training)"),
  // For continuous warmup cardio:
  duration_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Total duration in seconds (for continuous warmup exercises)"),
});

// 10. Mind Body Pose
const MindBodyPoseSchema = BaseExerciseSchema.extend({
  type: z.literal("mind-body-pose"),
  duration_sec: z.number().min(0).describe("Duration to hold pose in seconds"),
  media_url: z
    .string()
    .url()
    .nullish()
    .describe("URL to demonstration video or image"),
  // breathing inherited from BaseExerciseSchema - AI decides appropriate technique
});

// 11. Swim Lap Pool
const SwimLapPoolSchema = BaseExerciseSchema.extend({
  type: z.literal("swim-lap-pool"),
  target_distance_m: z
    .number()
    .min(0)
    .nullish()
    .describe("Target distance in meters"),
  duration_sec: z
    .number()
    .min(0)
    .nullish()
    .describe("Target duration in seconds"),
  pool_length_m: z
    .union([z.literal(25), z.literal(50)])
    .describe("Pool length in meters"),
  stroke_type: z
    .enum(["freestyle", "breaststroke", "backstroke", "butterfly"])
    .nullish()
    .describe("Swimming stroke type"),
});

// Discriminated Union of all Exercise types
// CRITICAL: Use ONLY these exact type values:
// "strength-set", "cardio-steady-running", "cardio-steady-walking",
// "cardio-steady-cycling-outdoor", "cardio-steady-cycling-indoor", "cardio-steady-elliptical",
// "cardio-steady-rowing", "cardio-steady-hiking", "cardio-interval", "mind-body-pose", "swim-lap-pool"
export const ExerciseSchema = z
  .discriminatedUnion("type", [
    StrengthSetExerciseSchema,
    CardioSteadyRunningSchema,
    CardioSteadyWalkingSchema,
    CardioSteadyCyclingOutdoorSchema,
    CardioSteadyCyclingIndoorSchema,
    CardioSteadyEllipticalSchema,
    CardioSteadyRowingSchema,
    CardioSteadyHikingSchema,
    CardioIntervalSchema,
    MindBodyPoseSchema,
    SwimLapPoolSchema,
  ])
  .describe(
    "EXERCISE TYPE (goes INSIDE block's exercises array, NOT at block level!). Must be EXACTLY one of: strength-set (gym exercises), cardio-steady-running, cardio-steady-walking, cardio-steady-cycling-outdoor, cardio-steady-cycling-indoor, cardio-steady-elliptical, cardio-steady-rowing, cardio-steady-hiking, cardio-interval (HIIT), mind-body-pose (stretching/yoga/mobility), swim-lap-pool. NEVER invent other types! NEVER use exercise type as block type!"
  );

// ============= BLOCK SCHEMA =============

export const BlockSchema = z.object({
  id: z
    .string()
    .describe(
      'Unique identifier for the block (e.g., "w1d1_warmup", "w1d1_main", "w1d1_cooldown")'
    ),
  type: z
    .enum(["warmup", "main", "cooldown"])
    .describe(
      'BLOCK TYPE (NOT exercise type!). Must be EXACTLY one of: "warmup", "main", "cooldown". This defines the workout phase, NOT the exercise activity. For cardio activities, the block is STILL "main" and exercises inside have cardio types.'
    ),
  title: z
    .string()
    .describe(
      'Human-readable title describing the block purpose (e.g., "Dynamic warmup & shoulder mobility", "Upper body - primary compounds", "Steady-state run")'
    ),
  exercises: z
    .array(ExerciseSchema)
    .min(1)
    .describe(
      'Array of exercises in this block. Exercise types are DIFFERENT from block types: warmup/cooldown blocks use "mind-body-pose" exercises, main blocks use "strength-set" or cardio exercise types (cardio-steady-running, cardio-steady-walking, etc). The block type stays "main" even for cardio activities!'
    ),
  notes: z
    .string()
    .nullish()
    .describe(
      "Additional notes for the entire block (duration, focus, instructions)"
    ),
});

// ============= WORKOUT DAY SCHEMA =============

export const WorkoutDaySchema = z.object({
  dayNumber: z
    .number()
    .min(1)
    .max(7)
    .describe(
      "Day number in the week (1=Monday, 7=Sunday). Use numbers matching the training schedule (e.g., 1, 3, 5 for Mon/Wed/Fri training)"
    ),
  activityType: z
    .enum([...ACTIVITY_TYPES])
    .describe(`Activity type (MUST be one of: ${ACTIVITY_TYPES.join(", ")})`),
  activityTypeDescriptive: z
    .string()
    .optional()
    .describe(
      'Human-readable description of the workout activity. Examples: "Gym - Upper Body Hypertrophy", "Running - Steady Endurance", "HIIT - Tabata", "Gym - Full Body". Be specific and descriptive.'
    ),
  blocks: z
    .array(BlockSchema)
    .min(1)
    .describe(
      'Array of workout blocks in order: typically [warmup, main, cooldown]. Each block has type="warmup"/"main"/"cooldown" and contains exercises. CRITICAL: block type is DIFFERENT from exercise type!'
    ),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .nullish()
    .describe(
      "Overall difficulty/intensity of this workout day relative to the user's fitness level. Consider exercise complexity, volume, and intensity when choosing."
    ),
  estimatedDuration: z
    .number()
    .min(0)
    .nullish()
    .describe(
      "Total estimated duration in SECONDS for the entire workout including warmup, main work, and cooldown. Example: 3600 for 60 minutes, 5400 for 90 minutes."
    ),
  notes: z
    .string()
    .nullish()
    .describe(
      "Additional notes, tips, or reminders for this workout day (e.g., pacing guidance, focus areas, recovery notes)"
    ),
  scheduledDate: z
    .string()
    .nullish()
    .describe(
      "Optional scheduled date in YYYY-MM-DD format (e.g., '2024-03-15'). Usually null during generation, filled by scheduler later."
    ),
});

// ============= WEEK SCHEMAS =============

// Single Week Schema (for generateWeek tool)
export const SingleWeekSchema = z.object({
  weekNumber: z
    .number()
    .min(1)
    .describe(
      "The week number in the program (1-indexed). Example: 1 for first week, 2 for second week, etc."
    ),
  days: z
    .array(WorkoutDaySchema)
    .min(1)
    .describe(
      "CRITICAL: Array MUST contain EXACTLY the number of training days per week specified by trainingFrequency. For 3x/week training, generate EXACTLY 3 day objects. For 4x/week, generate EXACTLY 4 day objects. Each day must have proper dayNumber (1-7), blocks with correct types (warmup/main/cooldown), and exercises with valid types."
    ),
  focus: z
    .string()
    .nullish()
    .describe(
      'Weekly focus or training theme (e.g., "Building baseline strength and form", "Increasing volume for hypertrophy", "Peak intensity week"). Motivational and descriptive.'
    ),
  progressionNotes: z
    .string()
    .nullish()
    .describe(
      "Specific notes about how this week progresses from previous weeks. Mention weight increases, rep increases, set additions, or intensity changes. Example: 'Increase weight by 5% on main lifts compared to Week 1'"
    ),
});

// Workout Week Schema (for final program output)
export const WorkoutWeekSchema = z.object({
  weekNumber: z.number().min(1),
  days: z.array(WorkoutDaySchema),
  focus: z.string().nullish(),
});

// ============= PROGRAM SCHEMA =============

export const WorkoutProgramSchema = z.object({
  weeks: z.array(WorkoutWeekSchema),
  summary: z.string().nullish(),
});

// ============= PLAN SCHEMAS =============

export const PlanStepStatusSchema = z.enum([
  "pending",
  "in_progress",
  "done",
  "error",
]);

export const PlanStepSchema = z.object({
  id: z.string().describe('Stable ID of the step, e.g. "step-1"'),
  label: z
    .string()
    .describe('Short label, e.g. "Investigate profile & constraints"'),
  description: z
    .string()
    .nullish()
    .describe("Optional longer description for the UI"),
  status: PlanStepStatusSchema.describe("Status of the step"),
});

export const GenerationPlanSchema = z.object({
  steps: z.array(PlanStepSchema),
});

// ============= TYPESCRIPT TYPES =============

export type Exercise = z.infer<typeof ExerciseSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type WorkoutDay = z.infer<typeof WorkoutDaySchema>;
export type SingleWeek = z.infer<typeof SingleWeekSchema>;
export type WorkoutWeek = z.infer<typeof WorkoutWeekSchema>;
export type WorkoutProgram = z.infer<typeof WorkoutProgramSchema>;
export type PlanStepStatus = z.infer<typeof PlanStepStatusSchema>;
export type PlanStep = z.infer<typeof PlanStepSchema>;
export type GenerationPlan = z.infer<typeof GenerationPlanSchema>;
