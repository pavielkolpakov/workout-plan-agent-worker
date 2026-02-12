import { FitnessGoal, Gender, PlanType } from "../types/questionnaire";

/**
 * Calculate age from birthday
 * @param birthday - Date of birth (Date object or ISO string)
 * @returns Age in years
 */
export function calculateAge(birthday: Date | string | undefined): number {
  if (!birthday) return 30; // Default age if not provided

  // Convert string to Date if needed
  const birthDate =
    typeof birthday === "string" ? new Date(birthday) : birthday;

  // Check if valid date
  if (isNaN(birthDate.getTime())) return 30;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Convert weight to kilograms
 * @param weight - Weight value
 * @param unit - Weight unit (kg or lbs)
 * @returns Weight in kilograms
 */
export function convertWeightToKg(
  weight: number,
  unit: "kg" | "lbs" = "kg"
): number {
  if (unit === "lbs") {
    return weight * 0.453592; // 1 lb = 0.453592 kg
  }
  return weight;
}

/**
 * Convert height to centimeters
 * Supports cm, ft, and ft_in formats (e.g., "5'11" or "5-11")
 * @param height - Height value (number for cm/ft, string for ft_in)
 * @param unit - Height unit (cm, ft, or ft_in)
 * @returns Height in centimeters
 */
export function convertHeightToCm(
  height: number | string,
  unit: "cm" | "ft" | "ft_in" = "cm"
): number {
  if (unit === "cm") return Number(height);

  if (unit === "ft") return (height as number) * 30.48;

  if (unit === "ft_in") {
    // Expect string like 5'11" or 5-11
    const s = String(height).replace(/["\s]/g, "");
    const m = s.match(/^(\d+)[\'\-](\d{1,2})$/);
    if (!m) throw new Error("Invalid ft_in format, e.g. 5'11\"");
    const ft = Number(m[1]);
    const inch = Number(m[2]);
    return Number((ft * 30.48 + inch * 2.54).toFixed(1));
  }
  return Number(height);
}

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 * This is the most accurate modern formula for BMR calculation.
 *
 * Formula:
 * - Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
 * - Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
 *
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @param age - Age in years
 * @param gender - Gender (male, female, or other)
 * @returns BMR in kilocalories per day
 */
export function calculateBMRMifflinStJeor(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (gender === "male") {
    return baseBMR + 5;
  } else if (gender === "female") {
    return baseBMR - 161;
  } else {
    // For 'other', use average of male and female
    return baseBMR - 78;
  }
}

/**
 * Calculate BMR (Basal Metabolic Rate) using Harris-Benedict Equation
 * Older formula, still widely used as a fallback.
 *
 * Formula:
 * - Men: BMR = 88.362 + (13.397 × weight) + (4.799 × height) - (5.677 × age)
 * - Women: BMR = 447.593 + (9.247 × weight) + (3.098 × height) - (4.330 × age)
 *
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @param age - Age in years
 * @param gender - Gender (male, female, or other)
 * @returns BMR in kilocalories per day
 */
export function calculateBMRHarrisBenedict(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  if (gender === "male") {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  } else if (gender === "female") {
    return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
  } else {
    // For 'other', use average of male and female
    const maleBMR = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
    const femaleBMR =
      447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
    return (maleBMR + femaleBMR) / 2;
  }
}

/**
 * Get base daily activity multiplier (lifestyle activity, not training)
 * Based on standard PAL (Physical Activity Level) multipliers
 *
 * These multipliers represent baseline daily activity from lifestyle,
 * NOT including structured training sessions:
 *
 * - mostly-sitting (1.2x): Desk job, <5K steps/day
 *   * Minimal daily movement, high sedentary time
 *   * Example: Office worker, remote worker
 *
 * - lightly-active (1.375x): Casual walking, 5-10K steps/day
 *   * Regular light movement throughout the day
 *   * Example: Teacher, retail associate, parent at home
 *
 * - on-your-feet (1.55x): Standing/moving most of day, 10-15K steps/day
 *   * Significant daily movement but not heavy labor
 *   * Example: Nurse, waiter, retail manager
 *
 * - physically-demanding (1.725x): Manual labor, >15K steps/day
 *   * Heavy physical work throughout the day
 *   * Example: Construction worker, mover, warehouse worker
 *   * ⚠️ IMPORTANT: Should reduce training volume to avoid overtraining
 *
 * @param dailyActivityLevel - Daily lifestyle activity level
 * @returns Base activity multiplier for daily lifestyle
 */
export function getDailyActivityMultiplier(
  dailyActivityLevel?: string
): number {
  switch (dailyActivityLevel) {
    case "mostly-sitting":
      return 1.2; // Sedentary (desk job, minimal movement)
    case "lightly-active":
      return 1.375; // Light activity (regular walking, light daily movement)
    case "on-your-feet":
      return 1.55; // Moderate activity (standing/moving most of day)
    case "physically-demanding":
      return 1.725; // Very active (manual labor, very active job)
    default:
      return 1.375; // Default to lightly active if not specified
  }
}

/**
 * Get activity multiplier based on training frequency and session duration
 * This represents ADDITIONAL activity from structured training on top of daily activity
 *
 * Training adds metabolic demand beyond daily lifestyle activity:
 *
 * Frequency Impact:
 * - 0x/week: 0 (no training)
 * - 1-2x/week: +0.1 (minimal structured activity)
 * - 3x/week: +0.175 (standard beginner/maintenance)
 * - 4x/week: +0.25 (typical muscle building frequency)
 * - 5-6x/week: +0.35 (high frequency training)
 * - 7+x/week: +0.5 (athlete-level training)
 *
 * Duration Adjustment:
 * - <45min: -0.05 (shorter sessions, less total work)
 * - 45-75min: 0 (standard session length)
 * - 76-105min: +0.05 (longer sessions, more volume)
 * - >105min: +0.1 (very long sessions, high volume)
 *
 * Combined with dailyActivityLevel, this gives accurate TDEE:
 * Example: mostly-sitting (1.2) + 4x/week 60min (+0.25) = 1.45 multiplier
 *
 * @param trainingFrequency - Number of training days per week
 * @param sessionMinutes - Optional session duration in minutes (default: 60)
 * @returns Additional activity multiplier for training
 */
export function getTrainingMultiplierAddition(
  trainingFrequency: number,
  sessionMinutes?: number
): number {
  // Base additional activity from training frequency
  let baseAddition =
    trainingFrequency <= 0
      ? 0
      : trainingFrequency <= 2
        ? 0.1
        : trainingFrequency === 3
          ? 0.175
          : trainingFrequency === 4
            ? 0.25
            : trainingFrequency <= 6
              ? 0.35
              : 0.5;

  // Duration adjustment (soft steps)
  const m = sessionMinutes ?? 60;
  const durationAdj = m < 45 ? -0.05 : m <= 75 ? 0 : m <= 105 ? 0.05 : 0.1;

  return baseAddition + durationAdj;
}

/**
 * Get combined activity multiplier based on daily lifestyle AND training
 * This replaces the old getActivityMultiplier with a more accurate calculation
 * that separates daily activity from structured training
 *
 * @param trainingFrequency - Number of training days per week
 * @param sessionMinutes - Optional session duration in minutes (default: 60)
 * @param dailyActivityLevel - Optional daily lifestyle activity level
 * @returns Combined activity multiplier for TDEE calculation
 */
export function getActivityMultiplier(
  trainingFrequency: number,
  sessionMinutes?: number,
  dailyActivityLevel?: string
): number {
  // If dailyActivityLevel is provided, use the new combined approach
  if (dailyActivityLevel) {
    const baseMultiplier = getDailyActivityMultiplier(dailyActivityLevel);
    const trainingAddition = getTrainingMultiplierAddition(
      trainingFrequency,
      sessionMinutes
    );
    const combined = baseMultiplier + trainingAddition;

    // Safety bounds
    return Math.max(1.2, Math.min(2.2, Number(combined.toFixed(3))));
  }

  // Legacy behavior for backward compatibility (old calculation)
  let base =
    trainingFrequency <= 0
      ? 1.2
      : trainingFrequency <= 2
        ? 1.375
        : trainingFrequency === 3
          ? 1.55
          : trainingFrequency === 4
            ? 1.65
            : trainingFrequency <= 6
              ? 1.725
              : 1.9;

  // Duration adjustment (soft steps)
  const m = sessionMinutes ?? 60;
  const durationAdj = m < 45 ? -0.05 : m <= 75 ? 0 : m <= 105 ? 0.05 : 0.1;

  // Safety bounds
  return Math.max(1.2, Math.min(1.95, Number((base + durationAdj).toFixed(3))));
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × Activity Multiplier
 *
 * @param bmr - Basal Metabolic Rate in kcal
 * @param activityMultiplier - Activity level multiplier
 * @returns TDEE in kilocalories per day
 */
export function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return bmr * activityMultiplier;
}

/**
 * Adjust calories based on fitness goal and plan type
 * Uses percentage of TDEE with min/max bounds for safety
 *
 * Goal-Based Adjustments:
 *
 * 1. LOSE WEIGHT (Calorie Deficit):
 *    - Optimal Plan: 18% deficit (aggressive but sustainable)
 *      * Target: 0.8-1.0 kg/week fat loss
 *      * Example: 2500 TDEE → 2050 kcal (-450 kcal)
 *    - Wished Plan: 12% deficit (conservative, easier adherence)
 *      * Target: 0.5-0.6 kg/week fat loss
 *      * Example: 2500 TDEE → 2200 kcal (-300 kcal)
 *    - Safety bounds: 350-750 kcal deficit
 *
 * 2. BUILD MUSCLES (Calorie Surplus):
 *    - Optimal Plan: 8% surplus (maximize muscle gain)
 *      * Target: 0.3-0.5 kg/week gain (mix of muscle and minimal fat)
 *      * Example: 2500 TDEE → 2700 kcal (+200 kcal)
 *    - Wished Plan: 4% surplus (lean bulk, minimize fat gain)
 *      * Target: 0.2-0.3 kg/week gain (mostly muscle)
 *      * Example: 2500 TDEE → 2600 kcal (+100 kcal)
 *    - Safety bounds: 250-500 kcal surplus
 *
 * 3. KEEP FIT (Maintenance):
 *    - Both plans: TDEE ± 0 kcal
 *    - Maintain current weight and body composition
 *
 * Why these percentages?
 * - Too large deficit: Muscle loss, metabolic adaptation, poor adherence
 * - Too large surplus: Excess fat gain, limits lean muscle gain
 * - These ranges optimized for body composition, not just scale weight
 *
 * Weight Loss: 12-18% deficit (350-750 kcal)
 * Muscle Gain: 4-8% surplus (250-500 kcal)
 * Maintenance: TDEE ± 0 kcal
 *
 * @param tdee - Total Daily Energy Expenditure
 * @param fitnessGoal - Fitness goal (lose-weight, build-muscles, keep-fit)
 * @param planType - Plan type (optimal or wished)
 * @returns Adjusted daily calories in kilocalories
 */
export function adjustCaloriesForGoal(
  tdee: number,
  fitnessGoal: FitnessGoal,
  planType: PlanType
): number {
  if (fitnessGoal === "lose-weight") {
    const pct = planType === "optimal" ? 0.18 : 0.12; // 12-18%
    const delta = Math.min(Math.max(tdee * pct, 350), 750);
    return Math.round(tdee - delta);
  }
  if (fitnessGoal === "build-muscles") {
    const pct = planType === "optimal" ? 0.08 : 0.04;
    const delta = Math.min(Math.max(tdee * pct, 250), 500);
    return Math.round(tdee + delta);
  }
  return Math.round(tdee);
}

/**
 * Calculate complete daily calorie requirement
 * Combines all calculation steps:
 * 1. Calculate BMR using Mifflin-St Jeor (primary) or Harris-Benedict (fallback)
 * 2. Calculate TDEE = BMR × Activity Multiplier (combines daily activity + training)
 * 3. Adjust for fitness goal and plan type
 *
 * @param weight - Weight value
 * @param weightUnit - Weight unit (kg or lbs)
 * @param height - Height value (number for cm/ft, string for ft_in)
 * @param heightUnit - Height unit (cm, ft, or ft_in)
 * @param age - Age in years
 * @param gender - Gender
 * @param trainingFrequency - Training days per week
 * @param fitnessGoal - Fitness goal
 * @param planType - Plan type (optimal or wished)
 * @param trainingDuration - Optional training session duration in minutes
 * @param useHarrisBenedict - Use Harris-Benedict instead of Mifflin-St Jeor (default: false)
 * @param dailyActivityLevel - Optional daily lifestyle activity level
 * @returns Daily calorie requirement in kilocalories
 */
export function calculateDailyCalories(
  weight: number,
  weightUnit: "kg" | "lbs",
  height: number | string,
  heightUnit: "cm" | "ft" | "ft_in",
  age: number,
  gender: Gender,
  trainingFrequency: number,
  fitnessGoal: FitnessGoal,
  planType: PlanType,
  trainingDuration?: number,
  useHarrisBenedict: boolean = false,
  dailyActivityLevel?: string
): number {
  // Convert units to metric with validation bounds
  const weightKg = Math.max(
    35,
    Math.min(300, convertWeightToKg(weight, weightUnit))
  );
  const heightCm = Math.max(
    130,
    Math.min(230, convertHeightToCm(height, heightUnit))
  );

  // Calculate BMR
  const bmr = useHarrisBenedict
    ? calculateBMRHarrisBenedict(weightKg, heightCm, age, gender)
    : calculateBMRMifflinStJeor(weightKg, heightCm, age, gender);

  // Calculate TDEE with duration adjustment and daily activity level
  const activityMultiplier = getActivityMultiplier(
    trainingFrequency,
    trainingDuration,
    dailyActivityLevel
  );
  const tdee = bmr * activityMultiplier;

  // Adjust for goal
  return adjustCaloriesForGoal(tdee, fitnessGoal, planType);
}

/**
 * Calculate recommended target weight based on current weight, fitness goal, and duration
 * Provides realistic weight change expectations
 *
 * @param currentWeight - Current weight in kg
 * @param fitnessGoal - Fitness goal
 * @param weeks - Optional number of weeks for the plan
 * @returns Recommended target weight in kg, or undefined if inputs are invalid
 */
export function calculateRecommendedTargetWeight(
  currentWeight: number | undefined,
  fitnessGoal: FitnessGoal | undefined,
  weeks?: number
): number | undefined {
  if (!currentWeight || !fitnessGoal) return undefined;

  if (fitnessGoal === "build-muscles") {
    const rate = 0.0035; // 0.35% per week (realistic muscle gain)
    const delta = weeks ? currentWeight * rate * weeks : 2.5; // fallback ~2.5 kg
    return Math.round((currentWeight + Math.min(delta, 5)) * 10) / 10;
  }
  if (fitnessGoal === "lose-weight") {
    const rate = 0.006; // ~0.6% per week
    const delta = weeks
      ? currentWeight * rate * weeks
      : Math.min(6, currentWeight * 0.08);
    return Math.round((currentWeight - delta) * 10) / 10;
  }
  return Math.round(currentWeight * 10) / 10;
}
