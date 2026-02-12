import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { QuestionnaireData } from "../workout-program/types";

/**
 * Generation Step Schema
 * Defines structure for each step in the fitness program generation plan
 */
const GenerationStepSchema = z.object({
  id: z.string().describe("Stable step ID like 'step-1', 'step-2'"),
  component: z.enum(["workout", "nutrition", "sleep", "steps", "assembly"]),
  label: z.string().describe("Short label for the step"),
  description: z
    .string()
    .describe("Detailed description of what this step does"),
  dependsOn: z
    .array(z.string())
    .describe("Array of step IDs this step depends on"),
  canRunInParallel: z
    .boolean()
    .describe("Can this step run in parallel with others?"),
  parallelGroup: z
    .number()
    .optional()
    .nullish()
    .describe("Steps with same group run together"),
  status: z
    .enum(["pending", "in_progress", "done", "error"])
    .default("pending")
    .describe("Initial status must be 'pending'"),
  estimatedDuration: z.number().describe("Estimated duration in seconds"),
  reasoning: z
    .string()
    .optional()
    .nullish()
    .describe("Why this step is needed"),
  startedAt: z.string().optional().nullish().describe("Leave null initially"),
  completedAt: z.string().optional().nullish().describe("Leave null initially"),
  error: z.string().optional().nullish().describe("Leave null initially"),
});

/**
 * Fitness Generation Plan Schema
 * Complete plan for generating fitness program
 */
const FitnessGenerationPlanSchema = z.object({
  steps: z.array(GenerationStepSchema).min(4).max(10),
  estimatedTime: z.number().describe("Total estimated time in seconds"),
  componentsToGenerate: z.array(
    z.enum(["workout", "nutrition", "sleep", "steps"])
  ),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type FitnessGenerationPlan = z.infer<typeof FitnessGenerationPlanSchema>;
export type GenerationStep = z.infer<typeof GenerationStepSchema>;

/**
 * Generate execution plan for fitness program
 *
 * Architecture: Orchestrator-Worker Pattern
 * Reference: https://ai-sdk.dev/docs/agents/workflows#orchestrator-worker
 *
 * AI creates a detailed execution plan (orchestrator)
 * Executor will run plan with explicit control flow (worker)
 *
 * @param questionnaireData User's questionnaire responses and calculated data
 * @returns Promise<FitnessGenerationPlan> Execution plan with steps and dependencies
 */
export async function generateFitnessProgramPlan(
  questionnaireData: QuestionnaireData
): Promise<FitnessGenerationPlan> {
  console.log("[Plan Generator] 🎯 Creating generation plan...");

  // Extract relevant data for prompt
  const fitnessGoal = questionnaireData.wish?.fitnessGoal || "keep-fit";
  const trainingFrequency =
    questionnaireData.accessibility?.trainingFrequency || 4;
  const activities =
    questionnaireData.accessibility?.activities?.join(", ") || "Gym, HIIT";
  const durationDays = questionnaireData.selectedPlanData?.duration || 56;
  const weeksCount = Math.ceil(durationDays / 7);

  const systemPrompt = `You are a fitness program generation orchestrator.

Your task: Create a detailed execution plan for generating a complete fitness program.

USER PROFILE:
- Fitness Goal: ${fitnessGoal}
- Training Frequency: ${trainingFrequency} days/week
- Activities: ${activities}
- Program Duration: ${durationDays} days (${weeksCount} weeks)

COMPONENTS TO GENERATE:
1. Workout Program (foundation - must be first)
   - Multi-week training program with exercises, sets, reps
   - Takes ~30-60 seconds to generate
   
2. Nutrition Plan (depends on workout)
   - Calories, macros, meal timing
   - Needs workout data to adjust for training days
   - Takes ~15-25 seconds to generate
   
3. Sleep Schedule (depends on workout)
   - Optimal sleep times for recovery
   - Needs training schedule to optimize rest
   - Takes ~10-20 seconds to generate
   
4. Daily Steps Target (depends on workout)
   - Activity goals based on training load
   - Needs workout intensity to balance activity
   - Takes ~5-15 seconds to generate

PLAN REQUIREMENTS:
1. First step MUST be "workout" component (status: "pending" as const)
2. Steps 2-4 (nutrition, sleep, steps) MUST depend on step 1
3. Steps 2-4 CAN run in parallel (same parallelGroup: 1)
4. Final "assembly" step MUST depend on steps 2-4
5. All other steps MUST have status: "pending"

EXECUTION LOGIC:
- Steps with NO dependencies run first
- Steps with SAME parallelGroup run simultaneously via Promise.all
- Steps with dependencies wait for all dependsOn steps to complete
- Executor will handle parallelization automatically

DEPENDENCY RULES:
✅ CORRECT: workout (no deps) → nutrition/sleep/steps (depend on workout, parallelGroup: 1) → assembly
❌ WRONG: nutrition before workout, or steps not in parallel with nutrition/sleep

Create a plan that is EXECUTABLE, EFFICIENT, and follows all requirements.`;

  const userPrompt = `Create an optimal execution plan for generating this fitness program.

Requirements:
- Include exactly 5 steps: workout, nutrition, sleep, steps, assembly
- Step 1 must be workout with status "in_progress"
- Steps 2-4 must have parallelGroup: 1 (run together)
- Provide realistic time estimates based on component complexity
- Include reasoning for dependencies

Output format: Return a single JSON object with top-level keys: steps (array), estimatedTime (number), componentsToGenerate (array). Do not wrap the response in a schema or "type"/"properties" structure.`;

  try {
    const result = await generateObject({
      model: openai("gpt-5-mini"), // Latest mini model for fast planning
      system: systemPrompt,
      prompt: userPrompt,
      schema: FitnessGenerationPlanSchema,
    });

    const plan = result.object;
    return normalizeAndReturnPlan(plan);
  } catch (error: unknown) {
    console.error("[Plan Generator] ❌ Failed to create plan:", error);

    // Some models return JSON Schema wrapper {"type":"object","properties":{...}}
    const err = error as { text?: string; cause?: { text?: string } };
    const rawText =
      typeof err?.text === "string"
        ? err.text
        : typeof err?.cause?.text === "string"
          ? err.cause.text
          : null;
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText) as unknown;
        const candidate =
          parsed &&
          typeof parsed === "object" &&
          "properties" in parsed &&
          typeof (parsed as { properties?: unknown }).properties === "object"
            ? (parsed as { properties: Record<string, unknown> }).properties
            : parsed;
        const parsedPlan = FitnessGenerationPlanSchema.safeParse(candidate);
        if (parsedPlan.success) {
          console.log(
            "[Plan Generator] ✅ Recovered plan from schema-like response"
          );
          return normalizeAndReturnPlan(parsedPlan.data);
        }
      } catch {
        // ignore parse/validate errors, fall through to default plan
      }
    }

    // Fallback to default plan if AI fails
    console.log("[Plan Generator] 🔄 Using fallback default plan");
    return createDefaultPlan(questionnaireData);
  }
}

function normalizeAndReturnPlan(
  plan: FitnessGenerationPlan
): FitnessGenerationPlan {
  // Normalize all steps to pending status (AI sometimes generates wrong status)
  plan.steps.forEach((step: GenerationStep) => {
    step.status = "pending";
    step.startedAt = null;
    step.completedAt = null;
    step.error = null;
  });
  console.log("[Plan Generator] ✅ Plan created:", plan.steps.length, "steps");
  console.log(
    "[Plan Generator] ⏱️ Estimated time:",
    plan.estimatedTime,
    "seconds"
  );
  validatePlan(plan);
  return plan;
}

/**
 * Validate plan structure
 * Ensures plan follows required patterns
 */
function validatePlan(plan: FitnessGenerationPlan): void {
  // Check first step is workout
  const firstStep = plan.steps[0];
  if (firstStep.component !== "workout") {
    console.warn(
      "[Plan Generator] ⚠️ First step should be workout, got:",
      firstStep.component
    );
  }

  // Check workout has no dependencies
  if (firstStep.dependsOn.length > 0) {
    console.warn(
      "[Plan Generator] ⚠️ Workout step should have no dependencies"
    );
  }

  // Check parallel steps depend on workout
  const workoutId = firstStep.id;
  const parallelSteps = plan.steps.filter(
    (s) =>
      s.parallelGroup === 1 &&
      ["nutrition", "sleep", "steps"].includes(s.component)
  );

  parallelSteps.forEach((step) => {
    if (!step.dependsOn.includes(workoutId)) {
      console.warn(
        `[Plan Generator] ⚠️ ${step.component} should depend on workout`
      );
    }
  });
}

/**
 * Create default fallback plan
 * Used when AI plan generation fails
 *
 * @param questionnaireData User's questionnaire responses
 * @returns FitnessGenerationPlan Default plan with correct structure
 */
function createDefaultPlan(
  questionnaireData: QuestionnaireData
): FitnessGenerationPlan {
  const durationDays = questionnaireData.selectedPlanData?.duration || 56;
  const weeksCount = Math.ceil(durationDays / 7);
  const fitnessGoal = questionnaireData.wish?.fitnessGoal || "keep-fit";

  console.log(
    "[Plan Generator] 📋 Creating default plan for",
    weeksCount,
    "weeks"
  );

  return {
    steps: [
      {
        id: "step-1",
        component: "workout",
        label: "Generate Workout Program",
        description: `Create ${weeksCount}-week training program with progressive exercises`,
        dependsOn: [],
        canRunInParallel: false,
        status: "pending" as const,
        estimatedDuration: weeksCount >= 8 ? 50 : 35, // More weeks = more time
        reasoning:
          "Foundation component - all other plans depend on workout schedule",
      },
      {
        id: "step-2",
        component: "nutrition",
        label: "Generate Nutrition Plan",
        description: `Calculate calories and macros for ${fitnessGoal} goal`,
        dependsOn: ["step-1"],
        canRunInParallel: true,
        parallelGroup: 1,
        status: "pending",
        estimatedDuration: 20,
        reasoning:
          "Needs workout intensity data to adjust calories for training vs rest days",
      },
      {
        id: "step-3",
        component: "sleep",
        label: "Generate Sleep Schedule",
        description: "Optimize sleep times for recovery and training schedule",
        dependsOn: ["step-1"],
        canRunInParallel: true,
        parallelGroup: 1,
        status: "pending",
        estimatedDuration: 15,
        reasoning:
          "Needs workout schedule to optimize sleep around training times",
      },
      {
        id: "step-4",
        component: "steps",
        label: "Generate Daily Steps Target",
        description: "Set activity goals based on training load",
        dependsOn: ["step-1"],
        canRunInParallel: true,
        parallelGroup: 1,
        status: "pending",
        estimatedDuration: 10,
        reasoning:
          "Needs workout program to balance daily activity on rest days",
      },
      {
        id: "step-5",
        component: "assembly",
        label: "Assemble Complete Program",
        description: "Combine and validate all fitness program components",
        dependsOn: ["step-2", "step-3", "step-4"],
        canRunInParallel: false,
        status: "pending",
        estimatedDuration: 5,
        reasoning:
          "Final validation and assembly after all components generated",
      },
    ],
    estimatedTime: (weeksCount >= 8 ? 50 : 35) + 20 + 15 + 10 + 5, // Sum of durations
    componentsToGenerate: ["workout", "nutrition", "sleep", "steps"],
  };
}

/**
 * Get step by component type
 * Helper function to find step in plan
 */
export function findStepByComponent(
  plan: FitnessGenerationPlan,
  component: string
): GenerationStep | undefined {
  return plan.steps.find((step) => step.component === component);
}

/**
 * Check if all dependencies are satisfied
 * Helper for executor to determine if step is ready
 */
export function areDependenciesSatisfied(
  step: GenerationStep,
  plan: FitnessGenerationPlan
): boolean {
  return step.dependsOn.every((depId) => {
    const depStep = plan.steps.find((s) => s.id === depId);
    return depStep?.status === "done";
  });
}
