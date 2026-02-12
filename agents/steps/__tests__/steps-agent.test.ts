import type { QuestionnaireData } from "../../workout-program/types";
import { generateStepsTargetCalculated } from "../agent";
import {
  calculateRestDayAdjustment,
  calculateStepsTarget,
  calculateTrainingDayAdjustment,
  generateReasoning,
  generateTips,
} from "../recommendations";

describe("Steps Agent - Recommendations", () => {
  const baseQuestionnaireData: QuestionnaireData = {
    currentState: {
      gender: "male",
      age: 30,
      weight: 75,
      weightUnit: "kg",
      height: 180,
      heightUnit: "cm",
      fitnessLevel: "intermediate",
      dailyActivityLevel: "lightly-active",
      currentBodyType: "average",
    },
    wish: {
      fitnessGoal: "keep-fit",
      targetBodyType: "muscular",
    },
    accessibility: {
      trainingFrequency: 4,
      trainingDuration: 60,
      activities: ["gym"],
    },
  };

  describe("calculateStepsTarget", () => {
    it("should calculate correct steps for lightly-active + keep-fit", () => {
      const result = calculateStepsTarget(baseQuestionnaireData);
      expect(result).toBe(8500); // Base for lightly-active * 1.0 (keep-fit)
    });

    it("should increase steps for weight loss goal", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "lose-weight" as const,
        },
      };
      const result = calculateStepsTarget(data);
      expect(result).toBeGreaterThan(8500); // Should be higher due to 1.3 multiplier
      expect(result).toBe(11050); // 8500 * 1.3
    });

    it("should decrease steps for muscle building goal", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "build-muscles" as const,
        },
      };
      const result = calculateStepsTarget(data);
      expect(result).toBeLessThan(8500); // Should be lower due to 0.9 multiplier
      expect(result).toBe(7650); // 8500 * 0.9
    });

    it("should adjust for fitness level", () => {
      const beginnerData = {
        ...baseQuestionnaireData,
        currentState: {
          ...baseQuestionnaireData.currentState,
          fitnessLevel: "beginner" as const,
        },
      };
      const advancedData = {
        ...baseQuestionnaireData,
        currentState: {
          ...baseQuestionnaireData.currentState,
          fitnessLevel: "advanced" as const,
        },
      };

      const beginnerSteps = calculateStepsTarget(beginnerData);
      const intermediateSteps = calculateStepsTarget(baseQuestionnaireData);
      const advancedSteps = calculateStepsTarget(advancedData);

      expect(beginnerSteps).toBe(intermediateSteps - 1000);
      expect(advancedSteps).toBe(intermediateSteps + 1000);
    });

    it("should adjust for high training frequency", () => {
      const highFrequency = {
        ...baseQuestionnaireData,
        accessibility: {
          ...baseQuestionnaireData.accessibility,
          trainingFrequency: 6,
        },
      };
      const normalFrequency = baseQuestionnaireData;

      const highFreqSteps = calculateStepsTarget(highFrequency);
      const normalSteps = calculateStepsTarget(normalFrequency);

      expect(highFreqSteps).toBe(normalSteps - 500);
    });

    it("should respect minimum and maximum bounds", () => {
      const extremeData = {
        ...baseQuestionnaireData,
        currentState: {
          ...baseQuestionnaireData.currentState,
          dailyActivityLevel: "mostly-sitting" as const,
          fitnessLevel: "beginner" as const,
        },
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "build-muscles" as const,
        },
      };

      const result = calculateStepsTarget(extremeData);
      expect(result).toBeGreaterThanOrEqual(5000);
      expect(result).toBeLessThanOrEqual(20000);
    });

    it("should handle different activity levels", () => {
      const activityLevels = [
        "mostly-sitting",
        "lightly-active",
        "on-your-feet",
        "physically-demanding",
      ] as const;

      const results = activityLevels.map((level) => {
        const data = {
          ...baseQuestionnaireData,
          currentState: {
            ...baseQuestionnaireData.currentState,
            dailyActivityLevel: level,
          },
        };
        return calculateStepsTarget(data);
      });

      // Steps should increase with activity level
      expect(results[1]).toBeGreaterThan(results[0]); // lightly-active > mostly-sitting
      expect(results[2]).toBeGreaterThan(results[1]); // on-your-feet > lightly-active
      expect(results[3]).toBeGreaterThan(results[2]); // physically-demanding > on-your-feet
    });
  });

  describe("calculateTrainingDayAdjustment", () => {
    it("should return 0 for weight loss goal", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "lose-weight" as const,
        },
      };
      const result = calculateTrainingDayAdjustment(data);
      expect(result).toBe(0);
    });

    it("should return negative adjustment for muscle building", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "build-muscles" as const,
        },
      };
      const result = calculateTrainingDayAdjustment(data);
      expect(result).toBeLessThan(0);
    });

    it("should adjust based on training duration for muscle building", () => {
      const shortDuration = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "build-muscles" as const,
        },
        accessibility: {
          ...baseQuestionnaireData.accessibility,
          trainingDuration: 45,
        },
      };
      const longDuration = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "build-muscles" as const,
        },
        accessibility: {
          ...baseQuestionnaireData.accessibility,
          trainingDuration: 90,
        },
      };

      const shortResult = calculateTrainingDayAdjustment(shortDuration);
      const longResult = calculateTrainingDayAdjustment(longDuration);

      expect(longResult).toBeLessThan(shortResult); // Longer training = more reduction
    });
  });

  describe("calculateRestDayAdjustment", () => {
    it("should return higher adjustment for weight loss", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "lose-weight" as const,
        },
      };
      const result = calculateRestDayAdjustment(data);
      expect(result).toBe(1500);
    });

    it("should return moderate adjustment for muscle building", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "build-muscles" as const,
        },
      };
      const result = calculateRestDayAdjustment(data);
      expect(result).toBe(500);
    });

    it("should adjust for sedentary lifestyle", () => {
      const sedentary = {
        ...baseQuestionnaireData,
        currentState: {
          ...baseQuestionnaireData.currentState,
          dailyActivityLevel: "mostly-sitting" as const,
        },
      };
      const active = {
        ...baseQuestionnaireData,
        currentState: {
          ...baseQuestionnaireData.currentState,
          dailyActivityLevel: "on-your-feet" as const,
        },
      };

      const sedentaryResult = calculateRestDayAdjustment(sedentary);
      const activeResult = calculateRestDayAdjustment(active);

      expect(sedentaryResult).toBeGreaterThan(activeResult);
    });
  });

  describe("generateReasoning", () => {
    it("should generate meaningful reasoning text", () => {
      const stepsTarget = 8500;
      const reasoning = generateReasoning(baseQuestionnaireData, stepsTarget);
      console.log("\n🧪 Testing: Reasoning generation", reasoning);
      // Handle locale-specific formatting (8,500 or 8 500 or 8.500 or 8500)
      // Check for the number and "steps" keyword rather than specific formatting
      expect(reasoning).toMatch(/8[\s,.]?500\s+steps/);
      expect(reasoning).toContain("light daily activity");
      expect(reasoning).toContain("intermediate");
    });

    it("should mention weight loss when applicable", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "lose-weight" as const,
        },
      };
      const reasoning = generateReasoning(data, 11000);

      expect(reasoning).toContain("weight loss");
      expect(reasoning).toContain("calorie burn");
    });

    it("should mention muscle building when applicable", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "build-muscles" as const,
        },
      };
      const reasoning = generateReasoning(data, 7500);

      expect(reasoning).toContain("muscle building");
    });
  });

  describe("generateTips", () => {
    it("should generate at least 4 tips", () => {
      const tips = generateTips(baseQuestionnaireData);
      expect(tips.length).toBeGreaterThanOrEqual(4);
    });

    it("should include sedentary-specific tips for desk workers", () => {
      const data = {
        ...baseQuestionnaireData,
        currentState: {
          ...baseQuestionnaireData.currentState,
          dailyActivityLevel: "mostly-sitting" as const,
        },
      };
      const tips = generateTips(data);

      const tipsText = tips.join(" ").toLowerCase();
      expect(
        tipsText.includes("hourly") ||
          tipsText.includes("reminder") ||
          tipsText.includes("stairs")
      ).toBe(true);
    });

    it("should include weight loss specific tips", () => {
      const data = {
        ...baseQuestionnaireData,
        wish: {
          ...baseQuestionnaireData.wish,
          fitnessGoal: "lose-weight" as const,
        },
      };
      const tips = generateTips(data);

      const tipsText = tips.join(" ").toLowerCase();
      expect(tipsText.includes("walk") || tipsText.includes("calorie")).toBe(
        true
      );
    });

    it("should return maximum 6 tips", () => {
      const tips = generateTips(baseQuestionnaireData);
      expect(tips.length).toBeLessThanOrEqual(6);
    });
  });

  describe("generateStepsTargetCalculated", () => {
    it("should generate complete steps target", () => {
      console.log("\n🧪 Testing: Steps target generation (calculated)");
      const result = generateStepsTargetCalculated({
        questionnaireData: baseQuestionnaireData,
      });

      console.log("✅ Generated steps target:", {
        dailyGoal: result.target.baseline.dailyStepsGoal,
        reasoning: result.target.reasoning?.substring(0, 80) + "...",
        tips: result.target.tips?.length + " tips",
      });

      expect(result.target).toBeDefined();
      expect(result.target.baseline.dailyStepsGoal).toBeGreaterThan(0);
      expect(result.target.reasoning).toBeTruthy();
      expect(result.target.tips).toBeDefined();
      expect(result.target.tips!.length).toBeGreaterThan(0);

      console.log("✓ All required fields present");
    });

    it("should include adjustments when workout program provided", () => {
      console.log("\n🧪 Testing: Steps with workout program adjustments");
      // Mock minimal workout program
      const mockWorkout = {
        weeks: [
          {
            weekNumber: 1,
            focus: "Test",
            days: [
              {
                dayNumber: 1,
                activityType: "Gym - Strength",
                blocks: [],
              },
            ],
          },
        ],
      };

      console.log("📊 Workout context:", { hasProgram: true, days: 1 });

      const result = generateStepsTargetCalculated({
        questionnaireData: baseQuestionnaireData,
        workoutProgram: mockWorkout as any,
      });

      console.log("✅ Results:", {
        baseline: result.target.baseline.dailyStepsGoal,
        adjustments: result.target.dailyAdjustments?.length || 0,
      });

      expect(result.target.dailyAdjustments).toBeDefined();
      expect(result.target.dailyAdjustments!.length).toBeGreaterThan(0);

      console.log("✓ Daily adjustments generated");
    });

    it("should not include adjustments when no workout program", () => {
      console.log("\n🧪 Testing: Steps without workout program");
      const result = generateStepsTargetCalculated({
        questionnaireData: baseQuestionnaireData,
      });

      console.log("✅ Results:", {
        baseline: result.target.baseline.dailyStepsGoal,
        adjustments: result.target.dailyAdjustments ? "present" : "undefined",
      });

      expect(result.target.dailyAdjustments).toBeUndefined();

      console.log("✓ No adjustments (as expected)");
    });

    it("should include metadata", () => {
      const result = generateStepsTargetCalculated({
        questionnaireData: baseQuestionnaireData,
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.calculationMethod).toBe("rule-based");
      expect(result.metadata?.basedOn).toContain("activityLevel");
      expect(result.metadata?.basedOn).toContain("fitnessGoal");
    });
  });
});
