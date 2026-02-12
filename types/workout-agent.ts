// Re-export from agents/fitness-program for consistency
export type {
  FitnessGenerationPlan as GenerationPlan,
  GenerationStep as PlanStep,
} from "../agents/fitness-program/plan-generator";

export type {
  FitnessProgramGenerationProgress,
  CompleteFitnessProgram,
} from "../agents/fitness-program/types";

// Legacy types (kept for backwards compatibility during migration)
export type { WorkoutProgram } from "./questionnaire";
