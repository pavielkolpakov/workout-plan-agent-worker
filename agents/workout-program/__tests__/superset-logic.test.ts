import {
  calculateSupersetScore,
  getSupersetRecommendation,
} from "../superset-logic";

describe("Superset Logic", () => {
  describe("calculateSupersetScore", () => {
    test("High score: 30min + lose-weight + intermediate + at-home + mostly-sitting", () => {
      const score = calculateSupersetScore({
        trainingDuration: 30,
        fitnessGoal: "lose-weight",
        fitnessLevel: "intermediate",
        activities: ["at-home", "hiit"],
        dailyActivityLevel: "mostly-sitting",
      });

      // Duration 30min: +3, Goal lose-weight: +2, Level intermediate: +1, Activities hiit: +1, Daily mostly-sitting: +1 = 8
      expect(score).toBe(8);
    });

    test("Medium score: 45min + keep-fit + intermediate + gym", () => {
      const score = calculateSupersetScore({
        trainingDuration: 45,
        fitnessGoal: "keep-fit",
        fitnessLevel: "intermediate",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      // Duration 45min: +2, Goal keep-fit: +1, Level intermediate: +1 = 4
      expect(score).toBe(4);
    });

    test("Low score: 90min + build-muscles + beginner + gym", () => {
      const score = calculateSupersetScore({
        trainingDuration: 90,
        fitnessGoal: "build-muscles",
        fitnessLevel: "beginner",
        activities: ["gym"],
        dailyActivityLevel: "physically-demanding",
      });

      // Duration 90min: 0, Goal build-muscles: 0, Level beginner: 0 = 0
      expect(score).toBe(0);
    });

    test("Score with advanced level: 60min + lose-weight + advanced", () => {
      const score = calculateSupersetScore({
        trainingDuration: 60,
        fitnessGoal: "lose-weight",
        fitnessLevel: "advanced",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      // Duration 60min: +1, Goal lose-weight: +2, Level advanced: +2 = 5
      expect(score).toBe(5);
    });
  });

  describe("getSupersetRecommendation", () => {
    test("Full intensity: 30min + lose-weight + intermediate + at-home", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 30,
        fitnessGoal: "lose-weight",
        fitnessLevel: "intermediate",
        activities: ["at-home", "hiit"],
        dailyActivityLevel: "mostly-sitting",
      });

      expect(rec.shouldUse).toBe(true);
      expect(rec.intensity).toBe("full");
      expect(rec.percentage).toBe(100);
      expect(rec.pairingStrategy).toBe("circuit"); // HIIT activity
      expect(rec.reasoning).toContain("Score: 8");
    });

    test("Most intensity: 45min + lose-weight + intermediate", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "lose-weight",
        fitnessLevel: "intermediate",
        activities: ["gym"],
        dailyActivityLevel: "mostly-sitting",
      });

      // Score: 2+2+1+1 = 6 → full (not most!)
      // Let's test actual "most" scenario: 45min + keep-fit + advanced
      const rec2 = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "keep-fit",
        fitnessLevel: "advanced",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      // Score: 2+1+2 = 5 → most
      expect(rec2.shouldUse).toBe(true);
      expect(rec2.intensity).toBe("most");
      expect(rec2.percentage).toBe(75);
      expect(rec2.pairingStrategy).toBe("antagonist"); // Gym + advanced
    });

    test("Half intensity: 60min + keep-fit + beginner", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 60,
        fitnessGoal: "keep-fit",
        fitnessLevel: "beginner",
        activities: ["gym"],
        dailyActivityLevel: "mostly-sitting",
      });

      expect(rec.shouldUse).toBe(true);
      expect(rec.intensity).toBe("half");
      expect(rec.percentage).toBe(50);
      expect(rec.pairingStrategy).toBe("upper-lower"); // Gym + beginner
    });

    test("Minimal intensity: 90min + build-muscles + beginner", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 90,
        fitnessGoal: "build-muscles",
        fitnessLevel: "beginner",
        activities: ["gym"],
        dailyActivityLevel: "physically-demanding",
      });

      expect(rec.shouldUse).toBe(false);
      expect(rec.intensity).toBe("minimal");
      expect(rec.percentage).toBe(25);
    });

    test("Pairing strategy: HIIT → circuit", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "lose-weight",
        fitnessLevel: "intermediate",
        activities: ["hiit"],
        dailyActivityLevel: "lightly-active",
      });

      expect(rec.pairingStrategy).toBe("circuit");
    });

    test("Pairing strategy: Gym + beginner → upper-lower", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "keep-fit",
        fitnessLevel: "beginner",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      expect(rec.pairingStrategy).toBe("upper-lower");
    });

    test("Pairing strategy: Gym + intermediate → antagonist", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "build-muscles",
        fitnessLevel: "intermediate",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      expect(rec.pairingStrategy).toBe("antagonist");
    });

    test("Pairing strategy: at-home → push-pull", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "lose-weight",
        fitnessLevel: "beginner",
        activities: ["at-home"],
        dailyActivityLevel: "lightly-active",
      });

      expect(rec.pairingStrategy).toBe("push-pull");
    });
  });

  describe("Edge cases", () => {
    test("Exact threshold: score 6 → full intensity", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 30,
        fitnessGoal: "lose-weight",
        fitnessLevel: "advanced",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      // Score: 3+2+2 = 7
      expect(rec.intensity).toBe("full");
      expect(rec.percentage).toBe(100);
    });

    test("Exact threshold: score 4 → most intensity", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "keep-fit",
        fitnessLevel: "intermediate",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      // Score: 2+1+1 = 4
      expect(rec.intensity).toBe("most");
      expect(rec.percentage).toBe(75);
    });

    test("Exact threshold: score 2 → half intensity", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "build-muscles",
        fitnessLevel: "beginner",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      // Score: 2+0+0 = 2
      expect(rec.shouldUse).toBe(true);
      expect(rec.intensity).toBe("half");
      expect(rec.percentage).toBe(50);
    });

    test("Score 1: minimal intensity, should not use", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 60,
        fitnessGoal: "build-muscles",
        fitnessLevel: "beginner",
        activities: ["gym"],
        dailyActivityLevel: "physically-demanding",
      });

      // Score: 1+0+0 = 1
      expect(rec.shouldUse).toBe(false);
      expect(rec.intensity).toBe("minimal");
    });

    test("Score 0: minimal intensity, should not use", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 120,
        fitnessGoal: "build-muscles",
        fitnessLevel: "beginner",
        activities: ["gym"],
        dailyActivityLevel: "physically-demanding",
      });

      // Score: 0+0+0 = 0
      expect(rec.shouldUse).toBe(false);
      expect(rec.intensity).toBe("minimal");
      expect(rec.percentage).toBe(25);
    });
  });

  describe("Real-world profiles", () => {
    test("Young Female Lose Weight (from test profiles)", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 45,
        fitnessGoal: "lose-weight",
        fitnessLevel: "beginner",
        activities: ["at-home", "hiit", "yoga"],
        dailyActivityLevel: "mostly-sitting",
      });

      // Score: 2+2+0+1+1 = 6 → full
      expect(rec.shouldUse).toBe(true);
      expect(rec.intensity).toBe("full");
      expect(rec.percentage).toBe(100);
      expect(rec.pairingStrategy).toBe("circuit");
    });

    test("Young Male Build Muscles (from test profiles)", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 90,
        fitnessGoal: "build-muscles",
        fitnessLevel: "intermediate",
        activities: ["gym", "hiit"],
        dailyActivityLevel: "lightly-active",
      });

      // Score: 0+0+1+1 = 2 → half
      expect(rec.shouldUse).toBe(true);
      expect(rec.intensity).toBe("half");
      expect(rec.percentage).toBe(50);
      expect(rec.pairingStrategy).toBe("circuit");
    });

    test("Female Minimal Time Available (expert example)", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 30,
        fitnessGoal: "keep-fit",
        fitnessLevel: "intermediate",
        activities: ["gym"],
        dailyActivityLevel: "lightly-active",
      });

      // Score: 3+1+1 = 5 → most
      expect(rec.shouldUse).toBe(true);
      expect(rec.intensity).toBe("most");
      expect(rec.percentage).toBe(75);
      expect(rec.pairingStrategy).toBe("antagonist");
    });

    test("Middle Aged Male Keep Fit", () => {
      const rec = getSupersetRecommendation({
        trainingDuration: 60,
        fitnessGoal: "keep-fit",
        fitnessLevel: "intermediate",
        activities: ["gym", "cycling", "swimming"],
        dailyActivityLevel: "lightly-active",
      });

      // Score: 1+1+1 = 3 → half
      expect(rec.shouldUse).toBe(true);
      expect(rec.intensity).toBe("half");
      expect(rec.percentage).toBe(50);
    });
  });
});
