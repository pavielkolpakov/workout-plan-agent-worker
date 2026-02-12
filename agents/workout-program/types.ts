/**
 * Workout Program Agent – TypeScript Types
 *
 * ProgressEvent is defined here so the API bundle does not pull in
 * fitness-program (and plan-generator). fitness-program/types re-exports
 * a compatible ProgressEvent for UI/context code.
 */

import type { RunSummary } from "../run-logger";

export interface QuestionnaireData {
  currentState: {
    gender?: string;
    age?: number | null;
    birthday?: string;
    weight?: number;
    weightUnit?: string;
    height?: number;
    heightUnit?: string;
    experienceLevel?: string;
    fitnessLevel?: string; // "beginner" | "intermediate" | "advanced"
    dailyActivityLevel?: string; // "mostly-sitting" | "lightly-active" | "on-your-feet" | "physically-demanding"
    currentBodyType?: string; // "slim" | "average" | "soft" | "muscular"
  };
  wish: {
    fitnessGoal?: string;
    targetWeight?: number;
    targetWeightUnit?: string;
    targetBodyType?: string; // "slim" | "average" | "soft" | "muscular"
  };
  accessibility: {
    trainingFrequency?: number;
    trainingDuration?: number;
    activities?: string[];
    equipment?: string[];
    environment?: string;
  };
  healthLimitations?: string | null;
  injuries?: string[] | string | null; // Array of injury types or comma-separated string
  allergies?: string | null;
  inspirationImage?: string;
  selectedPlan?: string;
  selectedPlanData?: {
    duration: number;
    frequency: string;
    activities: string[];
    calories: number;
    macros: {
      protein: number;
      carbs: number;
      fats: number;
    };
    [key: string]: any;
  };
}

/** Progress events emitted by generateWorkoutProgram (SSE to client) */
export type WorkoutProgressEvent =
  | {
      type: "plan-created";
      plan: unknown;
      currentComponent: string;
      status: "running";
      totalWeeks?: number;
    }
  | {
      type: "plan-updated";
      plan: unknown;
      currentComponent: string;
      status?: "running";
    }
  | {
      type: "week-generated";
      week: unknown;
      weekNumber: number;
      currentWeek: number;
      totalWeeks: number;
      currentComponent: "workout";
      status: "running";
    }
  | {
      type: "nutrition-generated";
      nutrition: unknown;
      currentComponent: "nutrition";
      status: "done";
    }
  | {
      type: "sleep-generated";
      sleep: unknown;
      currentComponent: "sleep";
      status: "done";
    }
  | {
      type: "steps-generated";
      steps: unknown;
      currentComponent: "steps";
      status: "done";
    }
  | {
      type: "status-update";
      currentComponent: string;
      currentStep?: string;
      status: "running" | "done" | "error";
    };

export interface GenerationOptions {
  questionnaireData: QuestionnaireData;
  onProgress?: (progress: WorkoutProgressEvent) => void;
  onComplete?: (program: any) => void;
  onError?: (error: Error) => void;
}

// Legacy type for backward compatibility
export interface GenerationProgress {
  currentWeek: number;
  totalWeeks: number;
  stepCount: number;
  status: "running" | "done" | "error";
}

export interface GenerationResult {
  program: any;
  nutrition?: any;
  sleep?: any;
  steps?: any;
  metadata: {
    generationMethod?: string;
    totalGenerationTime?: number;
    weeksGenerated?: number;
    stepsExecuted?: number;
    duration?: string;
    hasNutrition?: boolean;
    hasSleep?: boolean;
    hasSteps?: boolean;
    /** Agent runs and token usage (for logs and Langfuse) */
    usageSummary?: RunSummary;
  };
}
