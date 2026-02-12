/**
 * Simple Week Agent AI Test
 * Tests basic week generation functionality
 */

import type { QuestionnaireData } from "../types";
import { agentWeek, type WeekAgentContext } from "../week-agent";

const createTestProfile = (): QuestionnaireData => ({
  currentState: {
    gender: "male",
    age: 28,
    height: 180,
    weight: 80,
    fitnessLevel: "intermediate",
    dailyActivityLevel: "lightly-active",
    currentBodyType: "average",
  },
  wish: {
    fitnessGoal: "build-muscles",
    targetWeight: 85,
    targetBodyType: "muscular",
  },
  accessibility: {
    trainingFrequency: 3,
    trainingDuration: 60,
    activities: ["gym"],
  },
});

describe("agentWeek - Simple AI Test", () => {
  jest.setTimeout(150000); // 2.5 min for AI generation (GPT-5-mini with reasoning)

  // Skip if OPENAI_API_KEY is not set (expected for CI/test environments)
  const skipIfNoApiKey = !process.env.OPENAI_API_KEY ? it.skip : it;

  skipIfNoApiKey("should generate week with basic structure", async () => {
    const context: WeekAgentContext = {
      weekNumber: 1,
      weeksTotal: 4,
      questionnaireData: createTestProfile(),
      trainingFrequency: 3,
      trainingDuration: 60,
      activities: ["gym"],
      fitnessGoal: "build-muscles",
      previousWeeks: [],
    };

    try {
      const result = await agentWeek(context);

      // Basic structure validation only
      expect(result).toBeDefined();
      expect(result.week.weekNumber).toBe(1);
      expect(result.week.days).toBeDefined();

      console.log(
        `✅ Week generated successfully with ${result.week.days.length} days`
      );

      // If we got here without error, AI generated valid schema
      expect(result.week.days.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.error(`❌ Week generation failed:`, error.message);

      // Log the issue but don't fail test - schema validation issues are known
      if (error.message?.includes("did not match schema")) {
        console.log(
          "⚠️ Schema validation issue - AI generated invalid exercise types"
        );
        // Still throw to mark test as failed
        throw error;
      }
      throw error;
    }
  });
});
