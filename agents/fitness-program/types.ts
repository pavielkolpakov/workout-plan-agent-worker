/**
 * TypeScript Types for Fitness Program Orchestrator
 */

import type { NutritionPlan } from "../nutrition/types";
import type { SleepSchedule } from "../sleep/types";
import type { StepsTarget } from "../steps/types";
import type { WorkoutProgram, WorkoutWeek } from "../workout-program/schemas";
import type { QuestionnaireData } from "../workout-program/types";
import type { FitnessGenerationPlan } from "./plan-generator";

/**
 * Progress Event Types for Streaming
 *
 * All agents emit progress events that flow:
 * Backend → onProgress → API → SSE → Client → Client Store
 */
export type ProgressEvent =
  // Plan events - sent at start
  | {
      type: "plan-created";
      plan: FitnessGenerationPlan;
      currentComponent: string;
      status: "running";
    }
  // Workout events - sent for each week
  | {
      type: "week-generated";
      week: WorkoutWeek;
      weekNumber: number;
      currentWeek: number;
      totalWeeks: number;
      currentComponent: "workout";
      status: "running";
    }
  // Nutrition events - sent when complete
  | {
      type: "nutrition-generated";
      nutrition: NutritionPlan;
      currentComponent: "nutrition";
      status: "done";
    }
  // Sleep events - sent when complete
  | {
      type: "sleep-generated";
      sleep: SleepSchedule;
      currentComponent: "sleep";
      status: "done";
    }
  // Steps events - sent when complete
  | {
      type: "steps-generated";
      steps: StepsTarget;
      currentComponent: "steps";
      status: "done";
    }
  // Status events - sent for UI updates
  | {
      type: "status-update";
      currentComponent: string;
      currentStep?: string;
      status: "running" | "done" | "error";
    };

/**
 * Checkpoint structure for recovery
 */
export interface GenerationCheckpoint {
  timestamp: number;
  plan?: FitnessGenerationPlan;
  currentComponent: string;
  currentStep?: string;

  // Workout progress
  currentWeek?: number;
  totalWeeks?: number;
  weeksGenerated?: number;

  // Other components status
  hasNutrition: boolean;
  hasSleep: boolean;
  hasSteps: boolean;
}

export interface FitnessProgramGenerationOptions {
  questionnaireData: QuestionnaireData;
  onProgress?: (progress: ProgressEvent) => void;
  onComplete?: (program: CompleteFitnessProgram) => void;
  onError?: (error: Error) => void;
}

// Legacy type for backward compatibility - now uses ProgressEvent
export type FitnessProgramGenerationProgress = ProgressEvent;

export interface FitnessProgramGenerationResult {
  program: CompleteFitnessProgram;
  plan: FitnessGenerationPlan;
  metadata?: {
    generationMethod: string;
    totalGenerationTime: number;
    stepsExecuted?: number;
    componentsGenerated: string[];
  };
}

export interface CompleteFitnessProgram {
  workout: WorkoutProgram;
  nutrition: NutritionPlan;
  sleep: SleepSchedule;
  steps: StepsTarget;
  generatedAt: string;
  version: string;
}
