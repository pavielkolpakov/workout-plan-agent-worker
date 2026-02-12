/**
 * Nutrition Calculations
 * Reuses existing calorie calculation utilities and adds nutrition-specific logic
 */

import { FitnessGoal, Gender, PlanType } from "../../types/questionnaire";
import { calculateDailyCalories } from "../../utils/calorie-calculations";
import type { WorkoutProgram } from "../workout-program/schemas";
import type { QuestionnaireData } from "../workout-program/types";
import type { Macros, MacroSplit } from "./schemas";

/**
 * Get nutrition calories from questionnaire data
 * Uses pre-calculated values from questionnaire if available,
 * otherwise falls back to calculation
 */
export function getNutritionCalories(
  questionnaireData: QuestionnaireData
): number {
  // Priority 1: Use pre-calculated calories from questionnaire
  if (questionnaireData?.selectedPlanData?.calories) {
    console.log(
      "[Nutrition] Using questionnaire calories:",
      questionnaireData.selectedPlanData.calories
    );
    return questionnaireData.selectedPlanData.calories;
  }

  // Priority 2: Fallback to calculation if not available
  console.log("[Nutrition] Questionnaire calories not found, calculating...");

  try {
    const weight = questionnaireData?.currentState?.weight || 70;
    const weightUnit = (questionnaireData?.currentState?.weightUnit || "kg") as
      | "kg"
      | "lbs";
    const height = questionnaireData?.currentState?.height || 170;
    const heightUnit = (questionnaireData?.currentState?.heightUnit || "cm") as
      | "cm"
      | "ft"
      | "ft_in";
    const age = questionnaireData?.currentState?.age || 30;
    const gender = (questionnaireData?.currentState?.gender ||
      "male") as Gender;
    const trainingFrequency =
      questionnaireData?.accessibility?.trainingFrequency || 3;
    const fitnessGoal = (questionnaireData?.wish?.fitnessGoal ||
      "keep-fit") as FitnessGoal;
    const planType: PlanType = "optimal";
    const trainingDuration = questionnaireData?.accessibility?.trainingDuration;
    const dailyActivityLevel =
      questionnaireData?.currentState?.dailyActivityLevel;

    const calories = calculateDailyCalories(
      weight,
      weightUnit,
      height,
      heightUnit,
      age,
      gender,
      trainingFrequency,
      fitnessGoal,
      planType,
      trainingDuration,
      false,
      dailyActivityLevel
    );

    return Math.round(calories);
  } catch (error) {
    console.error("[Nutrition] Calorie calculation failed:", error);
    // Final fallback: reasonable default based on goal
    const fitnessGoal = questionnaireData?.wish?.fitnessGoal;
    if (fitnessGoal === "lose-weight") return 1800;
    if (fitnessGoal === "build-muscles") return 2500;
    return 2000;
  }
}

/**
 * Get macro split from questionnaire data
 * Uses pre-calculated values if available, otherwise calculates
 */
export function getMacroSplitFromQuestionnaire(
  questionnaireData: QuestionnaireData
): MacroSplit | null {
  // Use pre-calculated macros from questionnaire if available
  if (questionnaireData?.selectedPlanData?.macros) {
    const macros = questionnaireData.selectedPlanData.macros;
    const total = macros.protein + macros.carbs + macros.fats;

    return {
      protein_percent: Math.round(
        ((macros.protein * 4) /
          (questionnaireData.selectedPlanData.calories || 2000)) *
          100
      ),
      carbs_percent: Math.round(
        ((macros.carbs * 4) /
          (questionnaireData.selectedPlanData.calories || 2000)) *
          100
      ),
      fats_percent: Math.round(
        ((macros.fats * 9) /
          (questionnaireData.selectedPlanData.calories || 2000)) *
          100
      ),
    };
  }

  return null;
}

/**
 * Calculate macro distribution based on fitness goal
 */
export function calculateMacroSplit(fitnessGoal: string): MacroSplit {
  // Macro splits optimized for different goals
  if (fitnessGoal === "lose-weight") {
    return {
      protein_percent: 40, // High protein for satiety and muscle preservation
      carbs_percent: 30, // Moderate carbs
      fats_percent: 30, // Healthy fats
    };
  }

  if (fitnessGoal === "build-muscles") {
    return {
      protein_percent: 30, // Adequate protein for muscle growth
      carbs_percent: 45, // Higher carbs for energy and glycogen
      fats_percent: 25, // Moderate fats
    };
  }

  // keep-fit: balanced approach
  return {
    protein_percent: 30,
    carbs_percent: 40,
    fats_percent: 30,
  };
}

/**
 * Calculate macro targets in grams from calories and split
 */
export function calculateMacroGrams(
  dailyCalories: number,
  macroSplit: MacroSplit
): Macros {
  // Calorie values: Protein = 4 cal/g, Carbs = 4 cal/g, Fats = 9 cal/g
  const proteinCalories = dailyCalories * (macroSplit.protein_percent / 100);
  const carbsCalories = dailyCalories * (macroSplit.carbs_percent / 100);
  const fatsCalories = dailyCalories * (macroSplit.fats_percent / 100);

  return {
    protein_g: Math.round(proteinCalories / 4),
    carbs_g: Math.round(carbsCalories / 4),
    fats_g: Math.round(fatsCalories / 9),
  };
}

/**
 * Calculate meal timing based on training schedule
 */
export function calculateMealTimings(workoutProgram?: WorkoutProgram): {
  breakfast: string;
  lunch: string;
  dinner: string;
  preWorkoutSnack?: string;
  postWorkoutSnack?: string;
} {
  // Default meal times
  const defaultTimings = {
    breakfast: "08:00",
    lunch: "13:00",
    dinner: "19:00",
  };

  if (!workoutProgram || workoutProgram.weeks.length === 0) {
    return defaultTimings;
  }

  // Analyze training patterns from first week
  const firstWeek = workoutProgram.weeks[0];
  const hasEarlyTraining = firstWeek.days.some((day) =>
    day.activityType?.toLowerCase().includes("morning")
  );

  const hasEveningTraining = firstWeek.days.some((day) =>
    day.activityType?.toLowerCase().includes("evening")
  );

  // Adjust meal times based on training schedule
  if (hasEarlyTraining) {
    return {
      breakfast: "06:30", // Earlier breakfast before morning training
      lunch: "12:30",
      dinner: "19:00",
      preWorkoutSnack: "05:45", // Quick pre-workout fuel
    };
  }

  if (hasEveningTraining) {
    return {
      breakfast: "08:00",
      lunch: "13:00",
      dinner: "20:00", // Later dinner after evening training
      preWorkoutSnack: "16:30", // Pre-workout snack
      postWorkoutSnack: "18:30", // Post-workout recovery
    };
  }

  return defaultTimings;
}

/**
 * Distribute calories across meals
 */
export function distributeMealCalories(
  dailyCalories: number,
  fitnessGoal: string
): {
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
} {
  if (fitnessGoal === "lose-weight") {
    // Weight loss: Larger breakfast, moderate lunch, smaller dinner
    return {
      breakfast: Math.round(dailyCalories * 0.3), // 30%
      lunch: Math.round(dailyCalories * 0.35), // 35%
      dinner: Math.round(dailyCalories * 0.25), // 25%
      snacks: Math.round(dailyCalories * 0.1), // 10%
    };
  }

  if (fitnessGoal === "build-muscles") {
    // Muscle building: Even distribution with more snacks
    return {
      breakfast: Math.round(dailyCalories * 0.25), // 25%
      lunch: Math.round(dailyCalories * 0.3), // 30%
      dinner: Math.round(dailyCalories * 0.3), // 30%
      snacks: Math.round(dailyCalories * 0.15), // 15%
    };
  }

  // Keep-fit: balanced distribution
  return {
    breakfast: Math.round(dailyCalories * 0.25), // 25%
    lunch: Math.round(dailyCalories * 0.35), // 35%
    dinner: Math.round(dailyCalories * 0.3), // 30%
    snacks: Math.round(dailyCalories * 0.1), // 10%
  };
}

/**
 * Calculate hydration needs
 */
export function calculateHydration(
  questionnaireData: QuestionnaireData,
  dailyCalories: number
): { dailyWater_liters: number; recommendations: string } {
  // Base hydration: 30ml per kg body weight
  const weight = questionnaireData?.currentState?.weight || 70;
  const weightUnit = questionnaireData?.currentState?.weightUnit || "kg";
  const weightKg = weightUnit === "lbs" ? weight * 0.453592 : weight;

  let baseWater = (weightKg * 30) / 1000; // liters

  // Add for activity level
  const trainingFrequency =
    questionnaireData?.accessibility?.trainingFrequency || 4;
  const trainingDuration =
    questionnaireData?.accessibility?.trainingDuration || 60;

  // Add 0.5-1L per hour of training per week
  const weeklyTrainingHours = (trainingFrequency * trainingDuration) / 60;
  const trainingWaterPerDay = (weeklyTrainingHours * 0.75) / 7; // 750ml per hour, daily average

  baseWater += trainingWaterPerDay;

  // Add for climate/activity (simplified)
  const dailyActivityLevel =
    questionnaireData?.currentState?.dailyActivityLevel || "lightly-active";
  if (dailyActivityLevel === "physically-demanding") {
    baseWater += 0.5;
  } else if (dailyActivityLevel === "on-your-feet") {
    baseWater += 0.3;
  }

  // Round to nearest 0.5L
  const dailyWater_liters = Math.round(baseWater * 2) / 2;

  // Clamp to reasonable range
  const finalWater = Math.max(2, Math.min(5, dailyWater_liters));

  const recommendations = `Drink water consistently throughout the day. Aim for ${Math.round(finalWater / 8)} glasses (250ml each). Increase intake on training days and in hot weather.`;

  return {
    dailyWater_liters: finalWater,
    recommendations,
  };
}

/**
 * Distribute macros across a meal proportionally
 */
export function distributeMacrosToMeal(
  totalMacros: Macros,
  mealCalories: number,
  totalCalories: number
): Macros {
  const proportion = mealCalories / totalCalories;

  return {
    protein_g: Math.round(totalMacros.protein_g * proportion),
    carbs_g: Math.round(totalMacros.carbs_g * proportion),
    fats_g: Math.round(totalMacros.fats_g * proportion),
  };
}

/**
 * ============================================
 * DAY-BY-DAY ADJUSTMENTS CALCULATIONS
 * ============================================
 */

/**
 * Categorize activity into standard types for adjustments
 */
export function categorizeActivityType(activityType: string): string {
  const type = activityType.toLowerCase();

  // High intensity
  if (
    type.includes("hiit") ||
    type.includes("interval") ||
    type.includes("combat") ||
    type.includes("boxing") ||
    type.includes("kickboxing") ||
    type.includes("mma")
  ) {
    return "hiit";
  }

  // Strength training
  if (
    type.includes("strength") ||
    type.includes("gym") ||
    type.includes("upper") ||
    type.includes("lower") ||
    type.includes("push") ||
    type.includes("pull") ||
    type.includes("legs")
  ) {
    return "strength";
  }

  // Steady cardio
  if (
    type.includes("cardio") ||
    type.includes("running") ||
    type.includes("cycling") ||
    type.includes("swimming") ||
    type.includes("walking")
  ) {
    return "cardio-steady";
  }

  // Light activity
  if (
    type.includes("yoga") ||
    type.includes("stretch") ||
    type.includes("pilates") ||
    type.includes("mind-body")
  ) {
    return "yoga";
  }

  // Rest
  if (type.includes("rest")) {
    return "rest";
  }

  return "moderate"; // default
}

/**
 * Calculate daily nutrition adjustments based on workout program
 * Analyzes each day's activity and provides specific calorie/macro adjustments
 */
export function calculateDailyNutritionAdjustments(
  workoutProgram: WorkoutProgram,
  baselineCalories: number,
  questionnaireData: QuestionnaireData
): {
  dayNumber: number;
  weekNumber: number;
  activityType: string;
  calorieAdjustment: number;
  macroEmphasis?: string;
  mealTimingNotes?: string;
  reasoning: string;
}[] {
  const adjustments: {
    dayNumber: number;
    weekNumber: number;
    activityType: string;
    calorieAdjustment: number;
    macroEmphasis?: string;
    mealTimingNotes?: string;
    reasoning: string;
  }[] = [];

  // Science-based calorie adjustments by activity type
  const CALORIE_ADJUSTMENTS: Record<string, number> = {
    hiit: +200, // High energy expenditure (400-600 kcal burned)
    strength: +100, // Moderate expenditure + recovery needs
    "cardio-steady": +150, // Sustained energy expenditure
    yoga: +0, // Light activity, baseline sufficient
    rest: -100, // Lower energy needs on rest days
    moderate: +50, // Default for uncategorized activities
  };

  // Analyze first week (representative of the program)
  const firstWeek = workoutProgram.weeks[0];
  if (!firstWeek) return adjustments;

  firstWeek.days.forEach((day) => {
    const category = categorizeActivityType(day.activityType);
    const adjustment = CALORIE_ADJUSTMENTS[category] || 0;
    const adjustedCalories = baselineCalories + adjustment;

    // Calculate macro emphasis
    let macroEmphasis: string | undefined;
    if (category === "hiit" || category === "cardio-steady") {
      const carbsGrams = Math.round((adjustedCalories * 0.45) / 4); // 45% carbs
      macroEmphasis = `Carb boost: ${carbsGrams}g carbs today`;
    } else if (category === "strength") {
      const proteinGrams = Math.round((adjustedCalories * 0.35) / 4); // 35% protein
      macroEmphasis = `Protein focus: ${proteinGrams}g protein today`;
    } else if (category === "rest") {
      macroEmphasis = "Standard macros, moderate intake";
    }

    // Meal timing notes
    let mealTimingNotes: string | undefined;
    if (category === "hiit" || category === "cardio-steady") {
      mealTimingNotes =
        "Pre-workout: Carb-rich meal 1-2h before. Post-workout: Carbs + protein within 1h";
    } else if (category === "strength") {
      mealTimingNotes =
        "Post-workout: Protein shake + carbs within 1h for muscle recovery";
    } else if (category === "yoga") {
      mealTimingNotes = "Light meal before, regular timing throughout day";
    }

    // Reasoning
    const reasoning = generateNutritionReasoning(category, adjustment);

    adjustments.push({
      dayNumber: day.dayNumber,
      weekNumber: firstWeek.weekNumber,
      activityType: day.activityType,
      calorieAdjustment: adjustment,
      macroEmphasis,
      mealTimingNotes,
      reasoning,
    });
  });

  return adjustments;
}

/**
 * Generate reasoning for nutrition adjustments
 */
function generateNutritionReasoning(
  category: string,
  adjustment: number
): string {
  const reasons: Record<string, string> = {
    hiit: "High-intensity training burns 400-600 calories and depletes glycogen stores. Extra carbs needed for fuel and recovery.",
    strength:
      "Strength training requires extra protein for muscle repair and synthesis. Moderate calorie increase supports recovery.",
    "cardio-steady":
      "Sustained cardio burns calories steadily. Carb emphasis maintains energy levels throughout the session.",
    yoga: "Light activity with minimal additional energy expenditure. Baseline calories sufficient.",
    rest: "Lower energy needs on rest days. Slight calorie reduction while maintaining protein for recovery.",
    moderate:
      "Moderate activity requires small calorie increase above baseline.",
  };

  return (
    reasons[category] ||
    `Activity requires ${adjustment > 0 ? "additional" : "reduced"} energy intake.`
  );
}

/**
 * Adjust macros based on calorie adjustment
 */
export function adjustMacros(
  baseMacros: Macros,
  calorieAdjustment: number
): Macros {
  // Distribute calorie adjustment proportionally to current macro split
  const totalCalories =
    baseMacros.protein_g * 4 + baseMacros.carbs_g * 4 + baseMacros.fats_g * 9;
  const proteinRatio = (baseMacros.protein_g * 4) / totalCalories;
  const carbsRatio = (baseMacros.carbs_g * 4) / totalCalories;
  const fatsRatio = (baseMacros.fats_g * 9) / totalCalories;

  return {
    protein_g: Math.round(
      baseMacros.protein_g + (calorieAdjustment * proteinRatio) / 4
    ),
    carbs_g: Math.round(
      baseMacros.carbs_g + (calorieAdjustment * carbsRatio) / 4
    ),
    fats_g: Math.round(baseMacros.fats_g + (calorieAdjustment * fatsRatio) / 9),
  };
}
