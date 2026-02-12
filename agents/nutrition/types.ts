/**
 * TypeScript Types for Nutrition Agent
 */

import type { WorkoutProgram } from "../workout-program/schemas";
import type { QuestionnaireData } from "../workout-program/types";
import type {
  DailyNutritionAdjustment,
  HydrationPlan,
  Macros,
  MacroSplit,
  Meal,
  MealPlan,
  NutritionPlan,
  Snack,
} from "./schemas";

// Re-export types from schema (single source of truth)
export type {
  DailyNutritionAdjustment,
  HydrationPlan,
  Macros,
  MacroSplit,
  Meal,
  MealPlan,
  NutritionPlan,
  Snack,
};

export interface NutritionGenerationOptions {
  questionnaireData: QuestionnaireData;
  workoutProgram?: WorkoutProgram;
  onProgress?: (
    progress: import("../fitness-program/types").ProgressEvent
  ) => void;
  onComplete?: (plan: NutritionPlan) => void;
  onError?: (error: Error) => void;
}

// Legacy type for backward compatibility
export interface NutritionGenerationProgress {
  currentStep: string;
  status: "running" | "done" | "error";
}

export interface NutritionGenerationResult {
  plan: NutritionPlan;
  metadata?: {
    generationMethod: string;
    caloriesCalculationBasis: string;
    basedOn: string[];
    /** Token usage from AI call (for run logging / Langfuse) */
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}
