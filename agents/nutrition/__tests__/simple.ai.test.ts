/**
 * Simple Nutrition Agent AI Tests
 * Tests basic AI generation functionality
 */

import { agentNutrition } from "../agent";
import type { QuestionnaireData } from "../../workout-program/types";

const createTestProfile = (): QuestionnaireData => ({
  currentState: {
    gender: "male",
    age: 30,
    height: 180,
    weight: 80,
    fitnessLevel: "intermediate",
    dailyActivityLevel: "lightly-active",
  },
  wish: {
    fitnessGoal: "build-muscles",
    targetWeight: 85,
  },
  accessibility: {
    trainingFrequency: 4,
    trainingDuration: 60,
    activities: ["gym"],
  },
  selectedPlanData: {
    duration: 28,
    frequency: "4x/week",
    activities: ["gym"],
    calories: 2800,
    macros: { protein: 210, carbs: 315, fats: 78 },
    macroSplit: { protein_percent: 30, carbs_percent: 45, fats_percent: 25 },
  },
});

describe("agentNutrition - Simple AI Tests", () => {
  jest.setTimeout(90000); // GPT-5-mini with tools needs more time

  it("should generate nutrition plan with AI", async () => {
    const profile = createTestProfile();

    const result = await agentNutrition({
      questionnaireData: profile,
    });

    // Basic structure validation
    expect(result).toBeDefined();
    expect(result.plan).toBeDefined();
    expect(result.plan.baseline).toBeDefined();
    expect(result.plan.baseline.dailyCalories).toBeGreaterThan(2000);
    expect(result.plan.baseline.macros).toBeDefined();
    expect(result.plan.baseline.macroSplit).toBeDefined();
  });
});
