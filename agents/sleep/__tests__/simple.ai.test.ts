/**
 * Simple Sleep Agent AI Tests
 * Tests basic AI generation functionality
 */

import { agentSleep } from "../agent";
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

describe("agentSleep - Simple AI Tests", () => {
  jest.setTimeout(90000); // GPT-5-mini uses reasoning tokens, needs more time

  it("should generate sleep schedule with AI", async () => {
    const profile = createTestProfile();

    const result = await agentSleep({
      questionnaireData: profile,
    });

    // Basic structure validation
    expect(result).toBeDefined();
    expect(result.schedule).toBeDefined();
    expect(result.schedule.baseline).toBeDefined();
    expect(result.schedule.baseline.duration_minutes).toBeGreaterThan(400); // At least 6.5h
    expect(result.schedule.baseline.duration_minutes).toBeLessThan(600); // At most 10h
    expect(result.schedule.baseline.bedtime).toBeDefined();
    expect(result.schedule.baseline.wakeTime).toBeDefined();
  });
});
