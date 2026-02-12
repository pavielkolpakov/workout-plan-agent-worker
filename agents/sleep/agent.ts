import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import {
  calculateBedtime,
  calculateDailySleepAdjustments,
  calculateOptimalSleepDuration,
  calculateWakeTime,
  generateSleepRecommendations,
  getUserTimezone,
} from "./calculations";
import { generateSleepSystemPrompt, generateSleepUserPrompt } from "./prompts";
import { SleepScheduleSchema } from "./schemas";
import type {
  SleepGenerationOptions,
  SleepGenerationResult,
  SleepSchedule,
} from "./types";

/**
 * Generate Sleep Schedule - Strategy 1: Calculation-based (Fallback)
 * Pure calculation without AI, used as fallback or for testing
 */
export function generateSleepScheduleCalculated(
  options: SleepGenerationOptions
): SleepGenerationResult {
  const { questionnaireData, workoutProgram } = options;

  // Calculate baseline sleep schedule (average for all days)
  const baselineDuration = calculateOptimalSleepDuration(
    questionnaireData,
    true // Use training day as baseline
  );
  const baselineWakeTime = calculateWakeTime(workoutProgram, true);
  const baselineBedtime = calculateBedtime(baselineWakeTime, baselineDuration);

  // Calculate daily adjustments if workout program available
  const dailyAdjustments = workoutProgram
    ? calculateDailySleepAdjustments(
        workoutProgram,
        baselineDuration,
        baselineBedtime,
        baselineWakeTime
      )
    : undefined;

  const schedule: SleepSchedule = {
    baseline: {
      bedtime: baselineBedtime,
      wakeTime: baselineWakeTime,
      duration_minutes: baselineDuration,
    },
    dailyAdjustments,
    timezone: getUserTimezone(),
    recommendations: generateSleepRecommendations(
      questionnaireData,
      workoutProgram
    ),
  };

  return {
    schedule,
    metadata: {
      generationMethod: "calculation-based",
      basedOn: [
        "fitnessGoal",
        "fitnessLevel",
        "trainingSchedule",
        "activityLevel",
      ],
    },
  };
}

/**
 * Generate Sleep Schedule - Strategy 2: AI-Personalized
 * Uses AI to create a more nuanced, personalized sleep schedule
 */
export async function agentSleep(
  options: SleepGenerationOptions
): Promise<SleepGenerationResult> {
  const { questionnaireData, workoutProgram, nutritionPlan, onProgress } =
    options;

  // Calculate baseline using our logic
  const calculatedSchedule = generateSleepScheduleCalculated(options);

  try {
    // Use AI to personalize with context
    const systemPrompt = generateSleepSystemPrompt(
      questionnaireData,
      workoutProgram
    );

    // Add nutrition context if available
    const nutritionContext = nutritionPlan
      ? `\n\nNUTRITION PLAN CONTEXT:
- Daily Calories: ${nutritionPlan.baseline.dailyCalories} kcal (baseline)
- Last Meal: Dinner at ${nutritionPlan.baseline.mealPlan.dinner.time}
- Bedtime should be 2-3 hours after dinner for optimal digestion

IMPORTANT: Calculate bedtime that respects meal timing!
If dinner is at ${nutritionPlan.baseline.mealPlan.dinner.time}, bedtime should not be before 2 hours later.`
      : "";

    const fullSystemPrompt = systemPrompt + nutritionContext;

    // Provide baseline as reference
    const baselineInfo = `

BASELINE CALCULATION (from our algorithm):
- Bedtime: ${calculatedSchedule.schedule.baseline.bedtime}
- Wake Time: ${calculatedSchedule.schedule.baseline.wakeTime}
- Duration: ${calculatedSchedule.schedule.baseline.duration_minutes} minutes

${
  calculatedSchedule.schedule.dailyAdjustments
    ? `
DAILY ADJUSTMENTS (calculated):
${calculatedSchedule.schedule.dailyAdjustments
  .map(
    (adj) =>
      `Day ${adj.dayNumber} (${adj.activityType}): ${adj.duration_minutes}min, bed ${adj.bedtime}, wake ${adj.wakeTime}`
  )
  .join("\n")}
`
    : ""
}

You can adjust these times if needed, but stay within reasonable bounds:
- Sleep duration: 360-600 minutes (6-10 hours)
- Bedtime: 21:00-00:00 (9 PM - midnight)
- Wake time: 05:00-08:00 (5 AM - 8 AM)
`;

    const result = await generateObject({
      model: openai("gpt-5-mini"),
      system: fullSystemPrompt + baselineInfo,
      prompt: generateSleepUserPrompt(),
      schema: SleepScheduleSchema,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "sleep-schedule",
      },
    });

    const generatedSchedule = result.object;
    const usage = result.usage;

    // ✅ Send complete sleep schedule to client
    if (onProgress) {
      onProgress({
        type: "sleep-generated",
        sleep: generatedSchedule,
        currentComponent: "sleep",
        status: "done",
      });
    }

    return {
      schedule: generatedSchedule,
      metadata: {
        generationMethod: "ai-personalized",
        basedOn: [
          "fitnessGoal",
          "fitnessLevel",
          "trainingSchedule",
          "activityLevel",
          "nutritionPlan",
        ],
        usage, // Pass full usage object (RunLogger will normalize)
      },
    };
  } catch (error) {
    console.error(
      "[Sleep Agent] AI generation failed, using calculated fallback:",
      error
    );
    // Return calculated fallback on error
    return calculatedSchedule;
  }
}

/**
 * Validate questionnaire data before generation
 */
export function validateQuestionnaireData(questionnaireData: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!questionnaireData) {
    errors.push("Questionnaire data is required");
    return { valid: false, errors };
  }

  // Optional validations - we have defaults for everything
  if (!questionnaireData.wish?.fitnessGoal) {
    console.warn("[Sleep Agent] Fitness goal not provided, using default");
  }

  if (!questionnaireData.currentState?.fitnessLevel) {
    console.warn("[Sleep Agent] Fitness level not provided, using default");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
