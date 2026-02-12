import { FitnessGoal } from "../../types/questionnaire";

/**
 * Superset Logic for Workout Program Generation
 * Determines when and how to use supersets based on user profile
 */

export interface SupersetCriteria {
  trainingDuration: number;
  fitnessGoal: FitnessGoal;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  activities: string[];
  dailyActivityLevel: string;
}

export interface SupersetRecommendation {
  shouldUse: boolean;
  intensity: "full" | "most" | "half" | "minimal";
  percentage: number; // 0-100
  reasoning: string;
  pairingStrategy: "antagonist" | "upper-lower" | "push-pull" | "circuit";
}

/**
 * Calculate superset intensity score based on multiple factors
 *
 * Score ranges:
 * - 6+: Full supersets (100%) - All exercises in supersets
 * - 4-5: Most supersets (75%) - Most exercises, heavy compounds can be standalone
 * - 2-3: Half supersets (50%) - About half, prioritize isolation
 * - <2: Minimal supersets (25%) - Strategic use only
 *
 * Scoring factors:
 * - Training Duration: Primary factor (30min: +3, 45min: +2, 60min: +1)
 * - Fitness Goal: lose-weight +2, keep-fit +1, build-muscles 0
 * - Fitness Level: advanced +2, intermediate +1, beginner 0
 * - Activity Type: time-efficient activities +1
 * - Daily Activity: mostly-sitting +1 (more training capacity)
 *
 * @param criteria - User profile criteria
 * @returns Score from 0-9+ indicating superset intensity
 */
export function calculateSupersetScore(criteria: SupersetCriteria): number {
  let score = 0;

  // Duration factor (primary) - shorter sessions need more efficiency
  if (criteria.trainingDuration <= 30) score += 3;
  else if (criteria.trainingDuration <= 45) score += 2;
  else if (criteria.trainingDuration <= 60) score += 1;

  // Goal factor - fat loss benefits from metabolic stress
  if (criteria.fitnessGoal === "lose-weight") score += 2;
  else if (criteria.fitnessGoal === "keep-fit") score += 1;

  // Fitness level factor - advanced can handle more intensity
  if (criteria.fitnessLevel === "advanced") score += 2;
  else if (criteria.fitnessLevel === "intermediate") score += 1;

  // Activity type factor - time-efficient activities align with supersets
  const hasTimeEfficient = criteria.activities.some((a) =>
    ["at-home", "fast-workout", "hiit"].includes(a)
  );
  if (hasTimeEfficient) score += 1;

  // Daily activity level (inverse - less daily activity = more training capacity)
  if (criteria.dailyActivityLevel === "mostly-sitting") score += 1;

  return score;
}

/**
 * Get superset recommendation based on user profile
 *
 * Returns detailed recommendation including:
 * - Whether to use supersets
 * - Intensity level (full/most/half/minimal)
 * - Target percentage of exercises in supersets
 * - Reasoning for the recommendation
 * - Recommended pairing strategy
 *
 * @param criteria - User profile criteria
 * @returns Superset recommendation with intensity and strategy
 */
export function getSupersetRecommendation(
  criteria: SupersetCriteria
): SupersetRecommendation {
  const score = calculateSupersetScore(criteria);

  // Determine intensity based on score
  let intensity: SupersetRecommendation["intensity"];
  let percentage: number;

  if (score >= 6) {
    intensity = "full";
    percentage = 100;
  } else if (score >= 4) {
    intensity = "most";
    percentage = 75;
  } else if (score >= 2) {
    intensity = "half";
    percentage = 50;
  } else {
    intensity = "minimal";
    percentage = 25;
  }

  // Determine pairing strategy based on activities and level
  let pairingStrategy: SupersetRecommendation["pairingStrategy"];
  if (criteria.activities.includes("hiit")) {
    // HIIT workouts benefit from circuit-style training
    pairingStrategy = "circuit";
  } else if (criteria.activities.includes("gym")) {
    // Gym workouts: beginners use upper-lower, advanced use antagonist
    pairingStrategy =
      criteria.fitnessLevel === "beginner" ? "upper-lower" : "antagonist";
  } else {
    // Default to push-pull for at-home and other activities
    pairingStrategy = "push-pull";
  }

  const reasoning = `Score: ${score}. Duration: ${criteria.trainingDuration}min, Goal: ${criteria.fitnessGoal}, Level: ${criteria.fitnessLevel}`;

  return {
    shouldUse: score >= 2,
    intensity,
    percentage,
    reasoning,
    pairingStrategy,
  };
}
