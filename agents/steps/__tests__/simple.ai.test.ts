/**
 * Simple Steps Agent AI Tests
 * Tests basic AI generation functionality
 */

import { agentSteps } from "../agent";
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
});

describe("agentSteps - Simple AI Tests", () => {
  jest.setTimeout(60000);

  it("should generate steps target with AI", async () => {
    const profile = createTestProfile();

    const result = await agentSteps({
      questionnaireData: profile,
    });

    // Basic structure validation
    expect(result).toBeDefined();
    expect(result.target).toBeDefined();
    expect(result.target.baseline.dailyStepsGoal).toBeGreaterThan(5000);
    expect(result.target.baseline.dailyStepsGoal).toBeLessThan(15000);
    expect(result.target.reasoning).toBeDefined();
    expect(result.target.tips).toBeDefined();
    expect(result.target.tips!.length).toBeGreaterThan(2);
  });
});
