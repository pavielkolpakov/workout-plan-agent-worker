/**
 * Workout Program Generator - TypeScript-Controlled Orchestrator
 *
 * Architecture: Orchestrator-Executor Pattern
 * Reference: https://ai-sdk.dev/docs/agents/workflows#orchestrator-worker
 *
 * Flow:
 * 1. AI creates execution plan (streaming to UI)
 * 2. TypeScript executes plan by calling agents directly
 * 3. Hardcoded parallelization: weeks sequential, components parallel
 */

import { FitnessGoal } from "../../types/questionnaire";
import { openai } from "@ai-sdk/openai";
import { observe, updateActiveTrace } from "@langfuse/tracing";
import { streamObject } from "ai";
import { z } from "zod";
import { RunLogger } from "../run-logger";
import "./langfuse";
import type { WorkoutProgram } from "./schemas";
import type {
  GenerationOptions,
  GenerationResult,
  QuestionnaireData,
} from "./types";

/**
 * Calculate age from birthday string or Date
 */
function calculateAge(birthday?: string | Date | null): number | null {
  if (!birthday) return null;
  const date = typeof birthday === "string" ? new Date(birthday) : birthday;
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calculate weeks count from questionnaire data
 */
function calculateWeeksCount(questionnaireData: QuestionnaireData): number {
  const durationDays = questionnaireData.selectedPlanData?.duration;
  return typeof durationDays === "number" && durationDays > 0
    ? Math.max(4, Math.ceil(durationDays / 7))
    : 8;
}

/**
 * Plan Generation Schema (simplified for streaming)
 */
const GenerationStepSchema = z
  .object({
    id: z.string(),
    component: z.enum(["workout", "nutrition", "sleep", "steps", "assembly"]),
    label: z.string(),
    description: z.string(),
    dependsOn: z.array(z.string()),
    canRunInParallel: z.boolean(),
    parallelGroup: z.number().nullish(),
    status: z.enum(["pending", "in_progress", "done", "error"]),
    estimatedDuration: z.number(),
    reasoning: z.string().nullish(),
    startedAt: z.string().nullish(),
    completedAt: z.string().nullish(),
    error: z.string().nullish(),
  })
  .describe(
    "A single step in the fitness program generation plan with component type, dependencies, and execution details"
  );

const FitnessGenerationPlanSchema = z
  .object({
    steps: z
      .array(GenerationStepSchema)
      .min(4)
      .max(10)
      .describe(
        "Array of generation steps that will be executed to create the complete fitness program"
      ),
    estimatedTime: z
      .number()
      .describe(
        "Total estimated time in seconds to complete all generation steps"
      ),
  })
  .describe(
    "Complete execution plan for generating a fitness program with workout, nutrition, sleep, and steps components"
  );

type GenerationPlan = z.infer<typeof FitnessGenerationPlanSchema>;
type GenerationStep = z.infer<typeof GenerationStepSchema>;

/**
 * Update plan status programmatically
 */
function updatePlanStatus(
  plan: GenerationPlan,
  stepId: string,
  status: "pending" | "in_progress" | "done" | "error",
  error?: string
) {
  const step = plan.steps.find((s) => s.id === stepId);
  if (!step) return;

  step.status = status;
  if (status === "in_progress" && !step.startedAt) {
    step.startedAt = new Date().toISOString();
  }
  if (status === "done" && !step.completedAt) {
    step.completedAt = new Date().toISOString();
  }
  if (status === "error" && error) {
    step.error = error;
  }
}

/**
 * Generate execution plan prompt
 */
function generatePlanPrompt(
  weeksCount: number,
  trainingFrequency: number,
  activities: string[],
  fitnessGoal: string
): string {
  return `Generate an execution plan with the following steps:

Step 1 - Workout Program:
- id: "step_workout"
- component: "workout"
- label: "Generate Workout Program (${weeksCount} weeks)"
- description: "Create a ${weeksCount}-week training program with ${trainingFrequency} days/week for ${activities.join(", ")} activities, focusing on ${fitnessGoal}"
- dependsOn: []
- canRunInParallel: false
- parallelGroup: null
- status: "pending"
- estimatedDuration: ${weeksCount * 15}

Step 2 - Nutrition Plan:
- id: "step_nutrition"
- component: "nutrition"
- label: "Generate Nutrition Plan"
- description: "Design nutrition plan with calorie and macro goals optimized for training days"
- dependsOn: ["step_workout"]
- canRunInParallel: true
- parallelGroup: 1
- status: "pending"
- estimatedDuration: 45

Step 3 - Sleep Schedule:
- id: "step_sleep"
- component: "sleep"
- label: "Generate Sleep Schedule"
- description: "Create optimal sleep schedule for recovery aligned with training days"
- dependsOn: ["step_workout"]
- canRunInParallel: true
- parallelGroup: 1
- status: "pending"
- estimatedDuration: 30

Step 4 - Steps Target:
- id: "step_steps"
- component: "steps"
- label: "Set Daily Steps Target"
- description: "Determine daily step goals balanced with workout intensity"
- dependsOn: ["step_workout"]
- canRunInParallel: true
- parallelGroup: 1
- status: "pending"
- estimatedDuration: 30

Total estimatedTime: ${weeksCount * 15 + 105} seconds

OUTPUT FORMAT EXAMPLE:
{
  "steps": [
    {"id": "step_workout", "component": "workout", ...},
    {"id": "step_nutrition", "component": "nutrition", ...},
    ...
  ],
  "estimatedTime": 165
}

Generate the actual plan object as shown above, NOT a JSON Schema!`;
}

/**
 * Generate workout program using TypeScript-controlled execution
 */
export const generateWorkoutProgram = observe(
  async (options: GenerationOptions): Promise<GenerationResult> => {
    const { questionnaireData, onProgress, onComplete, onError } = options;
    const startTime = Date.now();

    const weeksCount = calculateWeeksCount(questionnaireData);
    const trainingFrequency =
      questionnaireData.accessibility?.trainingFrequency || 4;
    const trainingDuration =
      questionnaireData.accessibility?.trainingDuration || 60;
    const activities = questionnaireData.accessibility?.activities || [
      "Gym",
      "HIIT",
    ];
    const fitnessGoal = (questionnaireData.wish?.fitnessGoal ||
      "keep-fit") as FitnessGoal;
    const healthLimitations = questionnaireData.healthLimitations;

    // Initialize program storage
    const program: WorkoutProgram = { weeks: [], summary: null };
    let nutritionPlan: any = null;
    let sleepSchedule: any = null;
    let stepsTarget: any = null;

    const runLogger = new RunLogger();

    updateActiveTrace({
      name: "workout-program-generation",
      input: { fitnessGoal, weeksCount, trainingFrequency, activities },
      metadata: {
        gender: questionnaireData.currentState?.gender,
        fitnessLevel: questionnaireData.currentState?.fitnessLevel,
      },
      tags: ["fitness-program", fitnessGoal],
    });

    console.log(
      `[Generator] 🚀 Starting fitness program generation: ${weeksCount} weeks, ${trainingFrequency} days/week`
    );

    try {
      // ============= STEP 1: Generate Plan with Streaming =============
      console.log("[Generator] 📋 Step 1: Generating execution plan...");

      const planPrompt = generatePlanPrompt(
        weeksCount,
        trainingFrequency,
        activities,
        fitnessGoal
      );

      const planStream = streamObject({
        model: openai("gpt-5-mini"),
        schema: FitnessGenerationPlanSchema,
        system:
          "You are a fitness program planner. Generate execution plan data, not a schema definition.",
        prompt: planPrompt,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "execution-plan",
        },
      });

      // Stream partial plan to UI as AI generates it
      let plan: GenerationPlan;
      for await (const partialPlan of planStream.partialObjectStream) {
        if (partialPlan.steps && partialPlan.steps.length > 0) {
          console.log(
            `[Generator] 📡 Streaming plan update: ${partialPlan.steps.length} steps`
          );
          if (onProgress) {
            onProgress({
              type: "plan-created",
              plan: partialPlan as any,
              currentComponent: "plan",
              status: "running",
              totalWeeks: weeksCount,
            });
          }
        }
      }

      // Get final plan
      const planResult = await planStream;
      plan = await planResult.object;

      if (!plan || !plan.steps || plan.steps.length === 0) {
        throw new Error("Failed to generate execution plan");
      }

      console.log(
        `[Generator] ✅ Plan created: ${plan.steps.length} steps, estimated ${plan.estimatedTime}s`
      );

      // Send final plan to UI (include totalWeeks so UI shows "Week 1 of 4" from the start)
      if (onProgress) {
        onProgress({
          type: "plan-created",
          plan: plan as any,
          currentComponent: "plan",
          status: "running",
          totalWeeks: weeksCount,
        });
      }

      // ============= STEP 2: Execute Workout Generation =============
      console.log(`[Generator] 🏋️ Step 2: Generating ${weeksCount} weeks...`);

      const workoutStep = plan.steps.find((s) => s.component === "workout");
      if (workoutStep) {
        updatePlanStatus(plan, workoutStep.id, "in_progress");
        if (onProgress) {
          onProgress({
            type: "plan-updated",
            plan: plan as any,
            currentComponent: "workout",
            status: "running",
          });
        }
      }

      // Import week agent
      const { agentWeek } = await import("./week-agent");

      // Generate weeks sequentially
      for (let weekNum = 1; weekNum <= weeksCount; weekNum++) {
        console.log(
          `[Generator] 📅 Generating week ${weekNum}/${weeksCount}...`
        );

        const result = await agentWeek({
          weekNumber: weekNum,
          weeksTotal: weeksCount,
          questionnaireData,
          trainingFrequency,
          trainingDuration,
          activities,
          fitnessGoal,
          healthLimitations,
          previousWeeks: program.weeks,
        });

        program.weeks.push(result.week);
        runLogger.logAgent("workout-week", result.usage);

        console.log(
          `[Generator] ✅ Week ${weekNum} generated: ${result.week.days.length} days`
        );

        // Send progress to UI
        if (onProgress) {
          onProgress({
            type: "week-generated",
            week: result.week as any,
            weekNumber: weekNum,
            currentWeek: weekNum,
            totalWeeks: weeksCount,
            currentComponent: "workout",
            status: "running",
          });
        }
      }

      // Mark workout step as done
      if (workoutStep) {
        updatePlanStatus(plan, workoutStep.id, "done");
        if (onProgress) {
          onProgress({
            type: "plan-updated",
            plan: plan as any,
            currentComponent: "workout",
            status: "running",
          });
        }
      }

      console.log(`[Generator] ✅ All ${weeksCount} weeks generated`);

      // ============= STEP 3: Generate Components in Parallel =============
      console.log(
        "[Generator] 🔄 Step 3: Generating components in parallel..."
      );

      // Mark component steps as in_progress
      const componentSteps = plan.steps.filter((s) =>
        ["nutrition", "sleep", "steps"].includes(s.component)
      );
      componentSteps.forEach((step) => {
        updatePlanStatus(plan, step.id, "in_progress");
      });
      if (onProgress) {
        onProgress({
          type: "plan-updated",
          plan: plan as any,
          currentComponent: "components",
          status: "running",
        });
      }

      // Import agents
      const { agentNutrition } = await import("../nutrition/agent");
      const { agentSleep } = await import("../sleep/agent");
      const { agentSteps } = await import("../steps/agent");

      // Generate all components in parallel (hardcoded parallelization)
      const [nutritionResult, sleepResult, stepsResult] = await Promise.all([
        agentNutrition({
          questionnaireData,
          workoutProgram: program,
          onProgress: () => {},
        }),
        agentSleep({
          questionnaireData,
          workoutProgram: program,
          onProgress: () => {},
        }),
        agentSteps({
          questionnaireData,
          workoutProgram: program,
          onProgress: () => {},
        }),
      ]);

      nutritionPlan = nutritionResult.plan;
      sleepSchedule = sleepResult.schedule;
      stepsTarget = stepsResult.target;

      // Log agent usage
      runLogger.logAgent("nutrition", nutritionResult.metadata?.usage);
      runLogger.logAgent("sleep", sleepResult.metadata?.usage);
      runLogger.logAgent("steps", stepsResult.metadata?.usage);

      console.log("[Generator] ✅ All components generated");

      // Send component results to UI
      if (onProgress) {
        onProgress({
          type: "nutrition-generated",
          nutrition: nutritionPlan,
          currentComponent: "nutrition",
          status: "done",
        });

        onProgress({
          type: "sleep-generated",
          sleep: sleepSchedule,
          currentComponent: "sleep",
          status: "done",
        });

        onProgress({
          type: "steps-generated",
          steps: stepsTarget,
          currentComponent: "steps",
          status: "done",
        });
      }

      // Mark component steps as done
      componentSteps.forEach((step) => {
        updatePlanStatus(plan, step.id, "done");
      });

      // Mark assembly step as done if exists
      const assemblyStep = plan.steps.find((s) => s.component === "assembly");
      if (assemblyStep) {
        updatePlanStatus(plan, assemblyStep.id, "done");
      }

      if (onProgress) {
        onProgress({
          type: "plan-updated",
          plan: plan as any,
          currentComponent: "assembly",
          status: "running",
        });
      }

      // ============= STEP 4: Return Complete Program =============
      const totalTime = Date.now() - startTime;

      console.log(
        `[Generator] 🎉 Generation complete in ${(totalTime / 1000).toFixed(1)}s`
      );
      runLogger.printSummary();

      const result: GenerationResult = {
        program,
        nutrition: nutritionPlan,
        sleep: sleepSchedule,
        steps: stepsTarget,
        metadata: {
          generationMethod: "orchestrator-executor",
          totalGenerationTime: totalTime,
          usageSummary: runLogger.getSummary(),
        },
      };

      if (onComplete) {
        onComplete({
          workout: program,
          nutrition: nutritionPlan,
          sleep: sleepSchedule,
          steps: stepsTarget,
          generatedAt: new Date().toISOString(),
          version: "2.0.0",
        });
      }

      return result;
    } catch (error) {
      console.error("[Generator] 💥 Generation error:", error);
      console.error(
        "[Generator] Error details:",
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error
      );

      if (onError) {
        onError(
          error instanceof Error ? error : new Error("Unknown generation error")
        );
      }

      throw error;
    }
  },
  { name: "workout-program-generation" }
);
