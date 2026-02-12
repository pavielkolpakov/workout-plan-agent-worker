import type { WorkoutProgram } from "../workout-program/schemas";
import type { QuestionnaireData } from "../workout-program/types";

/**
 * Sleep Timing Calculations
 * Calculate optimal sleep times based on user profile and training schedule
 */

/**
 * Calculate optimal sleep duration based on training intensity and fitness level
 */
export function calculateOptimalSleepDuration(
  questionnaireData: QuestionnaireData,
  isTrainingDay: boolean
): number {
  const fitnessLevel =
    questionnaireData?.currentState?.fitnessLevel || "intermediate";
  const trainingDuration =
    questionnaireData?.accessibility?.trainingDuration || 60;
  const fitnessGoal = questionnaireData?.wish?.fitnessGoal || "keep-fit";

  // Base sleep duration (in minutes)
  let baseDuration = 480; // 8 hours

  // Adjust for fitness level
  if (fitnessLevel === "beginner") {
    baseDuration += 15; // Beginners need slightly more recovery
  } else if (fitnessLevel === "advanced") {
    baseDuration -= 15; // Advanced athletes often train well with slightly less
  }

  // Adjust for training day
  if (isTrainingDay) {
    // More intense training = more recovery needed
    if (trainingDuration >= 90) {
      baseDuration += 30; // Long training sessions
    } else if (trainingDuration >= 60) {
      baseDuration += 15; // Standard training sessions
    }

    // Muscle building requires more recovery
    if (fitnessGoal === "build-muscles") {
      baseDuration += 15;
    }
  }

  // Ensure within healthy range (7-9 hours)
  return Math.max(420, Math.min(540, baseDuration));
}

/**
 * Calculate optimal wake time based on training schedule
 */
export function calculateWakeTime(
  workoutProgram?: WorkoutProgram,
  isTrainingDay: boolean = false
): string {
  if (!workoutProgram || workoutProgram.weeks.length === 0) {
    return "06:30"; // Default wake time
  }

  // Analyze training times from first week (representative)
  const firstWeek = workoutProgram.weeks[0];
  const trainingDays = firstWeek.days || [];

  // Check if there are morning workouts
  let earliestTrainingHour = 24;
  let hasEarlyMorningWorkouts = false;

  for (const day of trainingDays) {
    // Estimate workout time based on activity type
    // Most people train: 6-8am (morning), 12-1pm (lunch), 5-7pm (evening)
    const activityType = day.activityType?.toLowerCase() || "";

    if (activityType.includes("morning") || activityType.includes("early")) {
      hasEarlyMorningWorkouts = true;
      earliestTrainingHour = Math.min(earliestTrainingHour, 7);
    }
  }

  if (hasEarlyMorningWorkouts && isTrainingDay) {
    // Need to wake up 90 minutes before training (breakfast + prep)
    return "05:30";
  }

  // Standard wake time for most people
  return "06:30";
}

/**
 * Calculate bedtime from wake time and sleep duration
 */
export function calculateBedtime(
  wakeTime: string,
  sleepDuration: number
): string {
  const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);

  // Calculate bedtime by going backwards from wake time
  const wakeTimeMinutes = wakeHour * 60 + wakeMinute;
  let bedtimeMinutes = wakeTimeMinutes - sleepDuration;

  // Handle day rollover
  if (bedtimeMinutes < 0) {
    bedtimeMinutes += 24 * 60; // Add 24 hours
  }

  const bedtimeHour = Math.floor(bedtimeMinutes / 60);
  const bedtimeMinute = bedtimeMinutes % 60;

  return `${String(bedtimeHour).padStart(2, "0")}:${String(bedtimeMinute).padStart(2, "0")}`;
}

/**
 * Generate sleep recommendations based on user profile
 */
export function generateSleepRecommendations(
  questionnaireData: QuestionnaireData,
  workoutProgram?: WorkoutProgram
): string[] {
  const recommendations: string[] = [];
  const fitnessGoal = questionnaireData?.wish?.fitnessGoal || "keep-fit";
  const dailyActivityLevel =
    questionnaireData?.currentState?.dailyActivityLevel || "lightly-active";
  const trainingFrequency =
    questionnaireData?.accessibility?.trainingFrequency || 4;

  // Universal recommendations
  recommendations.push(
    "Maintain consistent sleep and wake times, even on weekends",
    "Keep your bedroom cool (60-67°F / 15-19°C) for optimal sleep"
  );

  // Goal-specific recommendations
  if (fitnessGoal === "build-muscles") {
    recommendations.push(
      "Prioritize 8-9 hours of sleep for muscle recovery and growth",
      "Avoid late-night heavy meals; eat protein 2-3 hours before bed"
    );
  } else if (fitnessGoal === "lose-weight") {
    recommendations.push(
      "Adequate sleep helps regulate hunger hormones (leptin and ghrelin)",
      "Aim for 7-8 hours minimum; poor sleep increases cravings"
    );
  }

  // Training frequency considerations
  if (trainingFrequency >= 5) {
    recommendations.push(
      "With high training frequency, sleep quality is crucial for recovery",
      "Consider a short 20-minute power nap on intense training days"
    );
  }

  // Activity level considerations
  if (dailyActivityLevel === "mostly-sitting") {
    recommendations.push(
      "Get natural sunlight exposure in the morning to regulate circadian rhythm",
      "Limit screen time 1 hour before bed to improve sleep quality"
    );
  } else if (dailyActivityLevel === "physically-demanding") {
    recommendations.push(
      "Your physical job requires extra recovery; prioritize sleep quality",
      "Consider gentle stretching or yoga before bed to ease muscle tension"
    );
  }

  // General best practices
  recommendations.push(
    "Avoid caffeine after 2 PM to prevent sleep interference",
    "Create a relaxing pre-sleep routine (reading, meditation, gentle stretching)"
  );

  return recommendations.slice(0, 8); // Max 8 recommendations
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn(
      "[Sleep Calculations] Could not determine timezone, using UTC"
    );
    return "UTC";
  }
}

/**
 * Format time for display
 */
export function formatTimeForDisplay(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * ============================================
 * DAY-BY-DAY ADJUSTMENTS CALCULATIONS
 * ============================================
 */

/**
 * Categorize activity type for sleep adjustments
 * (reuse from nutrition if needed, or duplicate for clarity)
 */
function categorizeActivityForSleep(activityType: string): string {
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
 * Calculate daily sleep adjustments based on workout program
 * Analyzes each day's activity intensity and provides specific sleep recommendations
 */
export function calculateDailySleepAdjustments(
  workoutProgram: WorkoutProgram,
  baselineDuration: number,
  baselineBedtime: string,
  baselineWakeTime: string
): {
  dayNumber: number;
  weekNumber: number;
  activityType: string;
  bedtime?: string;
  wakeTime?: string;
  duration_minutes?: number;
  reasoning: string;
}[] {
  const adjustments: {
    dayNumber: number;
    weekNumber: number;
    activityType: string;
    bedtime?: string;
    wakeTime?: string;
    duration_minutes?: number;
    reasoning: string;
  }[] = [];

  // Science-based sleep duration adjustments (in minutes)
  const SLEEP_DURATION_ADJUSTMENTS: Record<string, number> = {
    hiit: +30, // High CNS fatigue, needs extra recovery (8.5h total)
    strength: +15, // Muscle recovery needs (8h 15min total)
    "cardio-steady": +0, // Standard recovery sufficient (8h)
    yoga: +0, // Light activity (8h)
    rest: +15, // Extra recovery opportunity (8h 15min)
    moderate: +10, // Slightly more than baseline
  };

  // Analyze first week (representative)
  const firstWeek = workoutProgram.weeks[0];
  if (!firstWeek) return adjustments;

  firstWeek.days.forEach((day) => {
    const category = categorizeActivityForSleep(day.activityType);
    const durationAdjustment = SLEEP_DURATION_ADJUSTMENTS[category] || 0;
    const adjustedDuration = Math.min(
      600,
      Math.max(360, baselineDuration + durationAdjustment)
    );

    // Calculate adjusted bedtime (earlier if need more sleep, wake time stays same)
    const adjustedBedtime = adjustBedtimeForDuration(
      baselineWakeTime,
      adjustedDuration
    );

    // Reasoning
    const reasoning = generateSleepAdjustmentReasoning(
      category,
      durationAdjustment
    );

    adjustments.push({
      dayNumber: day.dayNumber,
      weekNumber: firstWeek.weekNumber,
      activityType: day.activityType,
      bedtime: adjustedBedtime,
      wakeTime: baselineWakeTime,
      duration_minutes: adjustedDuration,
      reasoning,
    });
  });

  return adjustments;
}

/**
 * Adjust bedtime to achieve target duration with fixed wake time
 */
function adjustBedtimeForDuration(
  wakeTime: string,
  targetDurationMinutes: number
): string {
  return calculateBedtime(wakeTime, targetDurationMinutes);
}

/**
 * Generate reasoning for sleep adjustments
 */
function generateSleepAdjustmentReasoning(
  category: string,
  durationAdjustment: number
): string {
  const reasons: Record<string, string> = {
    hiit: "High-intensity training causes significant CNS fatigue. Extra 30 min sleep supports nervous system recovery.",
    strength:
      "Strength training requires muscle repair during deep sleep. Extra 15 min ensures adequate recovery time.",
    "cardio-steady":
      "Moderate cardio allows standard 8-hour sleep. Consistent schedule supports performance.",
    yoga: "Light activity requires baseline sleep duration. Focus on sleep quality over quantity.",
    rest: "Rest days offer opportunity for extra recovery sleep. Extra 15 min supports overall adaptation.",
    moderate:
      "Moderate activity benefits from slightly extended sleep for optimal recovery.",
  };

  return (
    reasons[category] ||
    `Activity requires ${durationAdjustment > 0 ? "extra" : "standard"} sleep for recovery.`
  );
}

/**
 * Adjust bedtime by specific minutes (earlier = negative, later = positive)
 */
export function adjustBedtimeByMinutes(
  bedtime: string,
  adjustmentMinutes: number
): string {
  const [hour, minute] = bedtime.split(":").map(Number);
  let totalMinutes = hour * 60 + minute + adjustmentMinutes;

  // Handle day boundaries
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  } else if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
  }

  const adjustedHour = Math.floor(totalMinutes / 60);
  const adjustedMinute = totalMinutes % 60;

  return `${String(adjustedHour).padStart(2, "0")}:${String(adjustedMinute).padStart(2, "0")}`;
}

/**
 * Calculate sleep duration in hours and minutes
 */
export function formatSleepDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
