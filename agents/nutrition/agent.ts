import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  calculateDailyNutritionAdjustments,
  calculateHydration,
  calculateMacroGrams,
  calculateMacroSplit,
  getMacroSplitFromQuestionnaire,
  getNutritionCalories,
} from "./calculations";
import {
  generateNutritionSystemPrompt,
  generateNutritionUserPrompt,
} from "./prompts";
import { NutritionToolName, nutritionProgramTools } from "./tools";
import type {
  NutritionGenerationOptions,
  NutritionGenerationResult,
  NutritionPlan,
} from "./types";

/**
 * Nutrition Agent - Generate personalized nutrition plan using AI with tools
 */
export async function agentNutrition(
  options: NutritionGenerationOptions
): Promise<NutritionGenerationResult> {
  const { questionnaireData, workoutProgram, onProgress, onComplete, onError } =
    options;

  // Get calories from questionnaire (pre-calculated) or fallback to calculation
  const calculatedCalories = getNutritionCalories(questionnaireData);

  // Get macro split from questionnaire if available
  const questionnaireMacroSplit =
    getMacroSplitFromQuestionnaire(questionnaireData);

  // Build nutrition plan from tool results
  let nutritionPlan: Partial<NutritionPlan> = {
    baseline: {} as any, // Initialize baseline object
  };

  try {
    const systemPrompt = generateNutritionSystemPrompt(
      questionnaireData,
      workoutProgram,
      calculatedCalories,
      questionnaireMacroSplit
    );

    const result = await streamText({
      model: openai("gpt-5-mini"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: generateNutritionUserPrompt(),
        },
      ],
      tools: nutritionProgramTools,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "nutrition-plan",
      },
      onStepFinish: async ({ toolCalls, toolResults }) => {
        if (toolResults) {
          for (const toolResult of toolResults) {
            const resultData =
              (toolResult as any).result || (toolResult as any).output;

            if (toolResult.toolName === NutritionToolName.CalculateCalories) {
              nutritionPlan.baseline = {
                ...nutritionPlan.baseline,
                dailyCalories: resultData.dailyCalories,
              } as any;
              if (onProgress) {
                onProgress({
                  type: "status-update",
                  currentComponent: "nutrition",
                  currentStep: "Calculating calories",
                  status: "running",
                });
              }
            } else if (
              toolResult.toolName === NutritionToolName.DistributeMacros
            ) {
              nutritionPlan.baseline = {
                ...nutritionPlan.baseline,
                macros: resultData.macros,
                macroSplit: resultData.macroSplit,
              } as any;
              if (onProgress) {
                onProgress({
                  type: "status-update",
                  currentComponent: "nutrition",
                  currentStep: "Distributing macros",
                  status: "running",
                });
              }
            } else if (
              toolResult.toolName === NutritionToolName.CreateMealPlan
            ) {
              nutritionPlan.baseline = {
                ...nutritionPlan.baseline,
                mealPlan: resultData.mealPlan,
              } as any;
              if (onProgress) {
                onProgress({
                  type: "status-update",
                  currentComponent: "nutrition",
                  currentStep: "Creating meal plan",
                  status: "running",
                });
              }
            } else if (
              toolResult.toolName === NutritionToolName.AddHydrationPlan
            ) {
              nutritionPlan.baseline = {
                ...nutritionPlan.baseline,
                hydration: resultData.hydration,
              } as any;
              if (onProgress) {
                onProgress({
                  type: "status-update",
                  currentComponent: "nutrition",
                  currentStep: "Adding hydration plan",
                  status: "running",
                });
              }
            }
          }
        }
      },
    });

    // Wait for completion
    await result.text;
    const usage = await result.usage;

    // Validate we have all required fields
    if (
      !nutritionPlan.baseline?.dailyCalories ||
      !nutritionPlan.baseline?.macros ||
      !nutritionPlan.baseline?.mealPlan
    ) {
      // Use calculated fallback
      return generateNutritionPlanCalculated(options);
    }

    const completePlan = nutritionPlan as NutritionPlan;

    // Send complete nutrition plan to client
    if (onProgress) {
      onProgress({
        type: "nutrition-generated",
        nutrition: completePlan,
        currentComponent: "nutrition",
        status: "done",
      });
    }

    if (onComplete) {
      onComplete(completePlan);
    }

    return {
      plan: completePlan,
      metadata: {
        generationMethod: "ai-with-tools",
        caloriesCalculationBasis: "TDEE with goal adjustments",
        basedOn: ["userProfile", "fitnessGoal", "trainingProgram"],
        usage, // Pass full usage object (RunLogger will normalize)
      },
    };
  } catch (error) {
    return generateNutritionPlanCalculated(options);
  }
}

/**
 * Generate Nutrition Plan - Calculation-based fallback
 * Pure calculation without AI
 */
export function generateNutritionPlanCalculated(
  options: NutritionGenerationOptions
): NutritionGenerationResult {
  const { questionnaireData, workoutProgram } = options;

  const fitnessGoal = questionnaireData?.wish?.fitnessGoal || "keep-fit";

  // Get calories from questionnaire (pre-calculated) or fallback to calculation
  const dailyCalories = getNutritionCalories(questionnaireData);

  // Calculate macros
  const macroSplit = calculateMacroSplit(fitnessGoal);
  const macros = calculateMacroGrams(dailyCalories, macroSplit);

  // Calculate meal distribution
  const mealCalories = {
    breakfast: Math.round(dailyCalories * 0.25),
    lunch: Math.round(dailyCalories * 0.35),
    dinner: Math.round(dailyCalories * 0.3),
    snacks: Math.round(dailyCalories * 0.1),
  };

  // Calculate hydration
  const hydration = calculateHydration(questionnaireData, dailyCalories);

  // Calculate daily adjustments if workout program is available
  const dailyAdjustments = workoutProgram
    ? calculateDailyNutritionAdjustments(
        workoutProgram,
        dailyCalories,
        questionnaireData
      )
    : undefined;

  const plan: NutritionPlan = {
    baseline: {
      dailyCalories,
      macros,
      macroSplit,
      mealPlan: {
        breakfast: {
          time: "08:00",
          calories: mealCalories.breakfast,
          macros: {
            protein_g: Math.round(macros.protein_g * 0.25),
            carbs_g: Math.round(macros.carbs_g * 0.25),
            fats_g: Math.round(macros.fats_g * 0.25),
          },
          description: "Start your day with a balanced breakfast",
        },
        lunch: {
          time: "13:00",
          calories: mealCalories.lunch,
          macros: {
            protein_g: Math.round(macros.protein_g * 0.35),
            carbs_g: Math.round(macros.carbs_g * 0.35),
            fats_g: Math.round(macros.fats_g * 0.35),
          },
          description: "Main meal with protein and vegetables",
        },
        dinner: {
          time: "19:00",
          calories: mealCalories.dinner,
          macros: {
            protein_g: Math.round(macros.protein_g * 0.3),
            carbs_g: Math.round(macros.carbs_g * 0.3),
            fats_g: Math.round(macros.fats_g * 0.3),
          },
          description: "Lighter evening meal for better sleep",
        },
        snacks:
          mealCalories.snacks > 100
            ? [
                {
                  time: "16:00",
                  calories: mealCalories.snacks,
                  description: "Healthy snack between meals",
                },
              ]
            : undefined,
      },
      hydration,
    },
    dailyAdjustments,
  };

  return {
    plan,
    metadata: {
      generationMethod: "calculation-based",
      caloriesCalculationBasis: "Mifflin-St Jeor BMR + Activity",
      basedOn: ["userProfile", "fitnessGoal", "trainingFrequency"],
    },
  };
}

/**
 * Validate questionnaire data
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

  if (!questionnaireData.currentState?.weight) {
    errors.push("User weight is required for calorie calculations");
  }

  if (!questionnaireData.wish?.fitnessGoal) {
    errors.push("Fitness goal is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
