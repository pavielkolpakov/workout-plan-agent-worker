/**
 * TypeScript Types for Sleep Agent
 */

import type { NutritionPlan } from "../nutrition/types";
import type { WorkoutProgram } from "../workout-program/schemas";
import type { QuestionnaireData } from "../workout-program/types";
import type { DailySleepAdjustment, SleepSchedule } from "./schemas";

// Re-export types from schema (single source of truth)
export type { DailySleepAdjustment, SleepSchedule };

export interface SleepGenerationOptions {
  questionnaireData: QuestionnaireData;
  workoutProgram?: WorkoutProgram;
  nutritionPlan?: NutritionPlan;
  onProgress?: (
    progress: import("../fitness-program/types").ProgressEvent
  ) => void;
  onComplete?: (schedule: SleepSchedule) => void;
  onError?: (error: Error) => void;
}

export interface SleepGenerationResult {
  schedule: SleepSchedule;
  metadata?: {
    generationMethod: string;
    basedOn: string[];
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}
