/**
 * TypeScript Types for Steps Agent
 */

import type { WorkoutProgram } from "../workout-program/schemas";
import type { QuestionnaireData } from "../workout-program/types";
import type { DailyStepsAdjustment, StepsTarget } from "./schemas";

// Re-export types from schema (single source of truth)
export type { DailyStepsAdjustment, StepsTarget };

export interface StepsGenerationOptions {
  questionnaireData: QuestionnaireData;
  workoutProgram?: WorkoutProgram;
  onProgress?: (
    progress: import("../fitness-program/types").ProgressEvent
  ) => void;
  onComplete?: (target: StepsTarget) => void;
  onError?: (error: Error) => void;
}

export interface StepsGenerationResult {
  target: StepsTarget;
  metadata?: {
    calculationMethod: string;
    basedOn: string[];
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}
