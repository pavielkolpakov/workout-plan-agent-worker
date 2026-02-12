import { FitnessGoal } from "../../types/questionnaire";
import type { QuestionnaireData } from "../workout-program/types";
import type { WorkoutProgram } from "../workout-program/schemas";

/**
 * Steps Recommendation Logic
 * Calculates daily steps targets based on user profile and fitness goals
 */

/**
 * Base steps recommendations by activity level
 */
const BASE_STEPS_BY_ACTIVITY = {
  "mostly-sitting": 7000, // Desk job, need more intentional movement
  "lightly-active": 8500, // Some daily activity
  "on-your-feet": 10000, // Already moving throughout day
  "physically-demanding": 12000, // High daily activity
} as const;

/**
 * Goal-based adjustments (multipliers)
 */
const GOAL_MULTIPLIERS = {
  "lose-weight": 1.3, // Higher activity for calorie burn
  "build-muscles": 0.9, // Lower to preserve energy for strength training
  "keep-fit": 1.0, // Baseline maintenance
} as const;

/**
 * Fitness level adjustments
 */
const FITNESS_LEVEL_ADJUSTMENTS = {
  beginner: -1000, // Start conservatively
  intermediate: 0, // Standard target
  advanced: 1000, // Can handle more volume
} as const;

/**
 * Calculate recommended daily steps target
 */
export function calculateStepsTarget(
  questionnaireData: QuestionnaireData
): number {
  const activityLevel =
    questionnaireData?.currentState?.dailyActivityLevel || "lightly-active";
  const fitnessGoal =
    (questionnaireData?.wish?.fitnessGoal as FitnessGoal) || "keep-fit";
  const fitnessLevel =
    questionnaireData?.currentState?.fitnessLevel || "intermediate";
  const trainingFrequency =
    questionnaireData?.accessibility?.trainingFrequency || 4;

  // Start with base steps for activity level
  let baseSteps: number =
    (BASE_STEPS_BY_ACTIVITY as any)[activityLevel] || 8500;

  // Apply goal multiplier
  const goalMultiplier = GOAL_MULTIPLIERS[fitnessGoal] || 1.0;
  baseSteps = Math.round(baseSteps * goalMultiplier);

  // Apply fitness level adjustment
  const fitnessAdjustment: number =
    (FITNESS_LEVEL_ADJUSTMENTS as any)[fitnessLevel] || 0;
  baseSteps += fitnessAdjustment;

  // Adjust for training frequency (more training = slightly fewer steps on those days)
  // High frequency training needs recovery
  if (trainingFrequency >= 5) {
    baseSteps -= 500; // Reduce slightly for high-frequency trainers
  }

  // Ensure within reasonable bounds
  return Math.max(5000, Math.min(20000, baseSteps));
}

/**
 * Calculate training day adjustment
 */
export function calculateTrainingDayAdjustment(
  questionnaireData: QuestionnaireData
): number {
  const fitnessGoal =
    (questionnaireData?.wish?.fitnessGoal as FitnessGoal) || "keep-fit";
  const trainingDuration =
    questionnaireData?.accessibility?.trainingDuration || 60;

  // On training days, steps might be lower due to time spent exercising
  // But for weight loss, we want to maintain higher overall activity
  if (fitnessGoal === "lose-weight") {
    return 0; // Maintain full target even on training days
  }

  // For muscle building, allow lower steps on training days (recovery focus)
  if (fitnessGoal === "build-muscles") {
    return trainingDuration >= 60 ? -1000 : -500;
  }

  // Keep-fit: slight reduction on long training days
  return trainingDuration >= 75 ? -500 : 0;
}

/**
 * Calculate rest day adjustment
 */
export function calculateRestDayAdjustment(
  questionnaireData: QuestionnaireData
): number {
  const fitnessGoal =
    (questionnaireData?.wish?.fitnessGoal as FitnessGoal) || "keep-fit";
  const activityLevel =
    questionnaireData?.currentState?.dailyActivityLevel || "lightly-active";

  // On rest days, encourage more general movement
  if (fitnessGoal === "lose-weight") {
    return 1500; // Significantly higher for fat loss
  }

  if (fitnessGoal === "build-muscles") {
    return 500; // Slightly higher, but focus on recovery
  }

  // Keep-fit: moderate increase for active recovery
  return activityLevel === "mostly-sitting" ? 1000 : 500;
}

/**
 * Generate reasoning explanation
 */
export function generateReasoning(
  questionnaireData: QuestionnaireData,
  stepsTarget: number
): string {
  const activityLevel =
    questionnaireData?.currentState?.dailyActivityLevel || "lightly-active";
  const fitnessGoal =
    (questionnaireData?.wish?.fitnessGoal as FitnessGoal) || "keep-fit";
  const fitnessLevel =
    questionnaireData?.currentState?.fitnessLevel || "intermediate";

  const activityLevelText = {
    "mostly-sitting": "mostly sedentary lifestyle",
    "lightly-active": "light daily activity",
    "on-your-feet": "active daily routine",
    "physically-demanding": "physically demanding job",
  }[activityLevel];

  const goalText = {
    "lose-weight":
      "weight loss goal requires higher daily activity for calorie burn",
    "build-muscles":
      "muscle building focus with balanced activity to preserve energy for training",
    "keep-fit": "fitness maintenance with balanced activity levels",
  }[fitnessGoal];

  return `Based on your ${activityLevelText} and ${goalText}, your daily target is ${stepsTarget.toLocaleString()} steps. This target is personalized for your ${fitnessLevel} fitness level and supports your training program.`;
}

/**
 * Generate practical tips
 */
export function generateTips(questionnaireData: QuestionnaireData): string[] {
  const activityLevel =
    questionnaireData?.currentState?.dailyActivityLevel || "lightly-active";
  const fitnessGoal =
    (questionnaireData?.wish?.fitnessGoal as FitnessGoal) || "keep-fit";

  const tips: string[] = [
    "Take short walking breaks every hour throughout the day",
    "Park farther away from entrances to add extra steps",
  ];

  // Activity-specific tips
  if (activityLevel === "mostly-sitting") {
    tips.push(
      "Set hourly reminders to stand and walk for 5 minutes",
      "Take stairs instead of elevators whenever possible",
      "Walk while taking phone calls"
    );
  } else if (activityLevel === "physically-demanding") {
    tips.push(
      "Your job already provides significant activity - focus on recovery quality",
      "Use rest days for lighter walking to promote active recovery"
    );
  }

  // Goal-specific tips
  if (fitnessGoal === "lose-weight") {
    tips.push(
      "Add a 20-30 minute walk after dinner to boost daily calorie burn",
      "Use a fitness tracker to monitor and stay accountable to your steps"
    );
  } else if (fitnessGoal === "build-muscles") {
    tips.push(
      "Prioritize steps on rest days for active recovery",
      "Don't overdo cardio - save energy for strength training"
    );
  }

  // General tips
  tips.push(
    "Walk to nearby destinations instead of driving",
    "Use a standing desk if possible to increase daily movement"
  );

  return tips.slice(0, 6); // Return max 6 tips
}

/**
 * ============================================
 * DAY-BY-DAY ADJUSTMENTS CALCULATIONS
 * ============================================
 */

/**
 * Categorize activity type for steps adjustments
 */
function categorizeActivityForSteps(activityType: string): string {
  const type = activityType.toLowerCase();

  if (
    type.includes("hiit") ||
    type.includes("interval") ||
    type.includes("combat")
  ) {
    return "hiit";
  }
  if (
    type.includes("strength") ||
    type.includes("gym") ||
    type.includes("upper") ||
    type.includes("lower")
  ) {
    return "strength";
  }
  if (
    type.includes("cardio") ||
    type.includes("running") ||
    type.includes("cycling")
  ) {
    return "cardio-steady";
  }
  if (
    type.includes("yoga") ||
    type.includes("stretch") ||
    type.includes("pilates")
  ) {
    return "yoga";
  }
  if (type.includes("rest")) {
    return "rest";
  }

  return "moderate";
}

/**
 * Calculate daily steps adjustments based on workout program
 * Analyzes each day's activity and balances steps with training intensity
 */
export function calculateDailyStepsAdjustments(
  workoutProgram: WorkoutProgram,
  baselineSteps: number
): {
  dayNumber: number;
  weekNumber: number;
  activityType: string;
  stepsTarget: number;
  adjustment: number;
  reasoning: string;
}[] {
  const adjustments: {
    dayNumber: number;
    weekNumber: number;
    activityType: string;
    stepsTarget: number;
    adjustment: number;
    reasoning: string;
  }[] = [];

  // Science-based steps adjustments by activity type
  const STEPS_ADJUSTMENTS: Record<string, number> = {
    hiit: -2000, // Prioritize recovery after high-intensity
    strength: -1000, // Moderate reduction, light activity ok
    "cardio-steady": -500, // Already active, slight reduction
    yoga: +1000, // Low impact, can add more movement
    rest: +1500, // Compensate with NEAT (Non-Exercise Activity)
    moderate: +0, // Baseline sufficient
  };

  // Analyze first week (representative)
  const firstWeek = workoutProgram.weeks[0];
  if (!firstWeek) return adjustments;

  firstWeek.days.forEach((day) => {
    const category = categorizeActivityForSteps(day.activityType);
    const adjustment = STEPS_ADJUSTMENTS[category] || 0;

    // Calculate target with bounds (5000-20000 steps)
    const target = Math.max(5000, Math.min(20000, baselineSteps + adjustment));

    // Reasoning
    const reasoning = generateStepsAdjustmentReasoning(category, adjustment);

    adjustments.push({
      dayNumber: day.dayNumber,
      weekNumber: firstWeek.weekNumber,
      activityType: day.activityType,
      stepsTarget: target,
      adjustment: adjustment,
      reasoning,
    });
  });

  return adjustments;
}

/**
 * Generate reasoning for steps adjustments
 */
function generateStepsAdjustmentReasoning(
  category: string,
  adjustment: number
): string {
  const reasons: Record<string, string> = {
    hiit: "After high-intensity training, prioritize recovery. Reduce steps to avoid overtraining and support CNS recovery.",
    strength:
      "Light walking aids recovery without interfering with muscle repair. Moderate reduction balances activity and rest.",
    "cardio-steady":
      "Cardio session already provides significant movement. Slight reduction prevents excessive fatigue.",
    yoga: "Low-impact activity complements additional walking. Increase steps for well-rounded daily movement.",
    rest: "Rest days are perfect for NEAT (Non-Exercise Activity Thermogenesis). Increase steps to stay active while recovering.",
    moderate:
      "Moderate activity allows baseline steps. Balance movement with training demands.",
  };

  return (
    reasons[category] ||
    `Activity ${adjustment > 0 ? "allows" : "requires"} adjusted steps target.`
  );
}

/**
 * Calculate weekly steps target
 */
export function calculateWeeklyStepsTarget(
  dailyAdjustments: { stepsTarget: number }[]
): number {
  if (dailyAdjustments.length === 0) return 0;

  return dailyAdjustments.reduce((sum, adj) => sum + adj.stepsTarget, 0);
}
