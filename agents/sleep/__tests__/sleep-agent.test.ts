/**
 * Integration tests for Sleep Agent
 *
 * Tests the complete sleep schedule generation flow including:
 * - Baseline schedule calculation
 * - Daily adjustments based on training intensity
 * - Recovery optimization
 * - Edge cases and special scenarios
 */

import { generateSleepScheduleCalculated } from "../agent";
import type { QuestionnaireData } from "../../workout-program/types";

// Test data helper
const createTestProfile = (
  overrides?: Partial<QuestionnaireData>
): QuestionnaireData => {
  const base: QuestionnaireData = {
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

  if (overrides?.currentState) {
    base.currentState = { ...base.currentState, ...overrides.currentState };
  }
  if (overrides?.wish) {
    base.wish = { ...base.wish, ...overrides.wish };
  }
  if (overrides?.accessibility) {
    base.accessibility = { ...base.accessibility, ...overrides.accessibility };
  }

  return base;
};

describe("Sleep Agent - Integration Tests", () => {
  // Increase timeout for AI generation
  jest.setTimeout(30000);

  describe("Baseline Schedule", () => {
    it("should recommend 7-9h for adults", () => {
      console.log("\n🧪 Testing: Sleep schedule for 30-year-old adult");
      const profile = createTestProfile({
        currentState: { age: 30 },
      });

      console.log("📊 Input:", { age: profile.currentState.age });

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      const durationHours = result.schedule.baseline.duration_minutes / 60;

      console.log("✅ Generated sleep schedule:", {
        bedtime: result.schedule.baseline.bedtime,
        wakeTime: result.schedule.baseline.wakeTime,
        duration: `${durationHours}h (${result.schedule.baseline.duration_minutes} min)`,
      });

      expect(durationHours).toBeGreaterThanOrEqual(7);
      expect(durationHours).toBeLessThanOrEqual(9);

      console.log("✓ Duration validated (7-9h for adults)");
    });

    it("should recommend more sleep for beginners", () => {
      console.log("\n🧪 Testing: Sleep comparison - Beginner vs Intermediate");
      const beginnerProfile = createTestProfile({
        currentState: { fitnessLevel: "beginner" },
      });

      const intermediateProfile = createTestProfile({
        currentState: { fitnessLevel: "intermediate" },
      });

      console.log("📊 Generating for beginner...");
      const beginnerResult = generateSleepScheduleCalculated({
        questionnaireData: beginnerProfile,
        workoutProgram: undefined,
      });

      console.log("📊 Generating for intermediate...");
      const intermediateResult = generateSleepScheduleCalculated({
        questionnaireData: intermediateProfile,
        workoutProgram: undefined,
      });

      const beginnerHours =
        beginnerResult.schedule.baseline.duration_minutes / 60;
      const intermediateHours =
        intermediateResult.schedule.baseline.duration_minutes / 60;

      console.log("✅ Results:", {
        beginner: `${beginnerHours}h`,
        intermediate: `${intermediateHours}h`,
      });

      expect(
        beginnerResult.schedule.baseline.duration_minutes
      ).toBeGreaterThanOrEqual(
        intermediateResult.schedule.baseline.duration_minutes
      );

      console.log("✓ Beginner gets equal or more sleep than intermediate");
    });

    it("should provide realistic bedtime/wake time", () => {
      const profile = createTestProfile();

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      const { bedtime, wakeTime } = result.schedule.baseline;

      // Bedtime should be between 20:00 and 00:00
      const bedHour = parseInt(bedtime.split(":")[0]);
      expect(bedHour).toBeGreaterThanOrEqual(20);
      expect(bedHour).toBeLessThanOrEqual(23);

      // Wake time should be between 05:00 and 09:00
      const wakeHour = parseInt(wakeTime.split(":")[0]);
      expect(wakeHour).toBeGreaterThanOrEqual(5);
      expect(wakeHour).toBeLessThanOrEqual(9);
    });
  });

  describe("Daily Adjustments", () => {
    it("should increase sleep after heavy training", () => {
      const profile = createTestProfile({
        wish: { fitnessGoal: "build-muscles" },
      });

      // Mock workout program with heavy leg day
      const mockWorkout = {
        weeks: [
          {
            weekNumber: 1,
            focus: "Strength",
            days: [
              {
                dayNumber: 1,
                activityType: "Gym - Heavy Leg Day",
                blocks: [
                  {
                    id: "main",
                    type: "main",
                    title: "Legs",
                    exercises: [
                      {
                        id: "ex1",
                        type: "strength-set",
                        title: "Squat",
                        sets: 4,
                        reps: "8",
                        muscleGroups: ["quadriceps", "glutes"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: mockWorkout as any,
      });

      // Find adjustment for day 1 (heavy training)
      const day1Adjustment = result.schedule.dailyAdjustments?.find(
        (adj) => adj.dayNumber === 1
      );

      expect(day1Adjustment).toBeDefined();
      if (day1Adjustment?.duration_minutes) {
        expect(day1Adjustment.duration_minutes).toBeGreaterThan(
          result.schedule.baseline.duration_minutes
        );
      }
    });

    it("should allow later bedtime on rest days", () => {
      const profile = createTestProfile();

      // Mock workout program with rest day
      const mockWorkout = {
        weeks: [
          {
            weekNumber: 1,
            focus: "Recovery",
            days: [
              {
                dayNumber: 7,
                activityType: "Rest Day",
                blocks: [],
              },
            ],
          },
        ],
      };

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: mockWorkout as any,
      });

      // Find adjustment for day 7 (rest)
      const day7Adjustment = result.schedule.dailyAdjustments?.find(
        (adj) => adj.dayNumber === 7
      );

      expect(day7Adjustment).toBeDefined();
      if (day7Adjustment?.bedtime) {
        const baselineBedHour = parseInt(
          result.schedule.baseline.bedtime.split(":")[0]
        );
        const restDayBedHour = parseInt(day7Adjustment.bedtime.split(":")[0]);

        // Rest day bedtime should be same or later
        expect(restDayBedHour).toBeGreaterThanOrEqual(baselineBedHour);
      }
    });
  });

  describe("Recovery Optimization", () => {
    it("should align sleep with training split", () => {
      const profile = createTestProfile({
        accessibility: {
          trainingFrequency: 4,
          trainingDuration: 60,
          activities: ["gym"],
        },
      });

      // Mock Upper/Lower split
      const mockWorkout = {
        weeks: [
          {
            weekNumber: 1,
            focus: "Hypertrophy",
            days: [
              {
                dayNumber: 1,
                activityType: "Gym - Upper Body",
                blocks: [],
              },
              {
                dayNumber: 2,
                activityType: "Gym - Lower Body",
                blocks: [],
              },
              {
                dayNumber: 4,
                activityType: "Gym - Upper Body",
                blocks: [],
              },
              {
                dayNumber: 5,
                activityType: "Gym - Lower Body",
                blocks: [],
              },
            ],
          },
        ],
      };

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: mockWorkout as any,
      });

      // Lower body days should have more sleep than upper body days
      const lowerBodyAdjustments = result.schedule.dailyAdjustments?.filter(
        (adj) => adj.activityType.toLowerCase().includes("lower")
      );

      const upperBodyAdjustments = result.schedule.dailyAdjustments?.filter(
        (adj) => adj.activityType.toLowerCase().includes("upper")
      );

      if (
        lowerBodyAdjustments &&
        upperBodyAdjustments &&
        lowerBodyAdjustments.length > 0
      ) {
        const avgLowerSleep =
          lowerBodyAdjustments.reduce(
            (sum, adj) =>
              sum +
              (adj.duration_minutes ||
                result.schedule.baseline.duration_minutes),
            0
          ) / lowerBodyAdjustments.length;

        const avgUpperSleep =
          upperBodyAdjustments.reduce(
            (sum, adj) =>
              sum +
              (adj.duration_minutes ||
                result.schedule.baseline.duration_minutes),
            0
          ) / upperBodyAdjustments.length;

        expect(avgLowerSleep).toBeGreaterThanOrEqual(avgUpperSleep);
      }
    });

    it("should recommend consistent sleep for high frequency training", () => {
      const profile = createTestProfile({
        accessibility: {
          trainingFrequency: 6,
          trainingDuration: 60,
          activities: ["gym"],
        },
      });

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      // High frequency training should result in consistently high sleep needs
      const durationHours = result.schedule.baseline.duration_minutes / 60;
      expect(durationHours).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Edge Cases", () => {
    it("should handle senior with adjusted sleep needs", () => {
      const profile = createTestProfile({
        currentState: { age: 68 },
      });

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      // Seniors may need slightly different sleep patterns
      const durationHours = result.schedule.baseline.duration_minutes / 60;
      expect(durationHours).toBeGreaterThanOrEqual(7);
      expect(durationHours).toBeLessThanOrEqual(9);

      // Should include recommendations
      expect(result.schedule.recommendations).toBeDefined();
      expect(result.schedule.recommendations!.length).toBeGreaterThan(0);
    });

    it("should handle beginner with no workout program", () => {
      const profile = createTestProfile({
        currentState: { fitnessLevel: "beginner" },
      });

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      // Should still provide valid baseline
      expect(result.schedule.baseline).toBeDefined();
      expect(result.schedule.baseline.duration_minutes).toBeGreaterThan(0);
    });

    it("should handle extreme training volume", () => {
      const profile = createTestProfile({
        accessibility: {
          trainingFrequency: 6,
          trainingDuration: 120,
          activities: ["gym"],
        },
        wish: { fitnessGoal: "build-muscles" },
      });

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      // Very high training volume should require more sleep
      const durationHours = result.schedule.baseline.duration_minutes / 60;
      expect(durationHours).toBeGreaterThanOrEqual(8.5);
    });

    it("should handle minimal training frequency", () => {
      const profile = createTestProfile({
        accessibility: {
          trainingFrequency: 2,
          trainingDuration: 45,
          activities: ["gym"],
        },
      });

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      // Lower training frequency might allow for standard sleep
      const durationHours = result.schedule.baseline.duration_minutes / 60;
      expect(durationHours).toBeGreaterThanOrEqual(7);
      expect(durationHours).toBeLessThanOrEqual(8.5);
    });
  });

  describe("Data Structure Validation", () => {
    it("should return valid SleepSchedule structure", () => {
      const profile = createTestProfile();

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      // Check baseline structure
      expect(result.schedule.baseline).toBeDefined();
      expect(result.schedule.baseline.bedtime).toMatch(/^\d{2}:\d{2}$/);
      expect(result.schedule.baseline.wakeTime).toMatch(/^\d{2}:\d{2}$/);
      expect(result.schedule.baseline.duration_minutes).toBeGreaterThan(0);

      // Check timezone
      expect(result.schedule.timezone).toBeTruthy();

      // Check recommendations
      expect(result.schedule.recommendations).toBeDefined();
      expect(Array.isArray(result.schedule.recommendations)).toBe(true);

      // Check adjustments if present
      if (result.schedule.dailyAdjustments) {
        expect(Array.isArray(result.schedule.dailyAdjustments)).toBe(true);
        result.schedule.dailyAdjustments.forEach((adj) => {
          expect(adj.dayNumber).toBeGreaterThan(0);
          expect(adj.activityType).toBeTruthy();
          expect(adj.reasoning).toBeTruthy();
        });
      }
    });

    it("should include metadata", () => {
      const profile = createTestProfile();

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.generationMethod).toBeDefined();
    });
  });

  describe("Sleep Quality Recommendations", () => {
    it("should provide sleep hygiene tips", () => {
      const profile = createTestProfile();

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      expect(result.schedule.recommendations).toBeDefined();
      expect(result.schedule.recommendations!.length).toBeGreaterThan(0);

      // Should include practical tips
      const recommendationsText = result.schedule
        .recommendations!.join(" ")
        .toLowerCase();
      const hasRelevantTips =
        recommendationsText.includes("consistent") ||
        recommendationsText.includes("routine") ||
        recommendationsText.includes("dark") ||
        recommendationsText.includes("cool") ||
        recommendationsText.includes("screen");

      expect(hasRelevantTips).toBe(true);
    });

    it("should provide recovery-specific tips for muscle building", () => {
      const profile = createTestProfile({
        wish: { fitnessGoal: "build-muscles" },
      });

      const result = generateSleepScheduleCalculated({
        questionnaireData: profile,
        workoutProgram: undefined,
      });

      const recommendationsText = result.schedule
        .recommendations!.join(" ")
        .toLowerCase();
      const hasRecoveryTips =
        recommendationsText.includes("recovery") ||
        recommendationsText.includes("muscle") ||
        recommendationsText.includes("growth") ||
        recommendationsText.includes("repair");

      expect(hasRecoveryTips).toBe(true);
    });
  });
});
