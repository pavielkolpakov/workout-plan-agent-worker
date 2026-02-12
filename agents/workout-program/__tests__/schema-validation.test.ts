/**
 * Schema Validation Tests
 * Tests to ensure Block and Exercise schemas properly validate types
 */

import { BlockSchema, ExerciseSchema } from "../schemas";

describe("BlockSchema validation", () => {
  it("should accept valid warmup block", () => {
    const validBlock = {
      id: "w1d1_warmup",
      type: "warmup",
      title: "Dynamic warmup",
      exercises: [
        {
          id: "ex1",
          type: "mind-body-pose",
          title: "Arm circles",
          duration_sec: 60,
        },
      ],
    };

    expect(() => BlockSchema.parse(validBlock)).not.toThrow();
  });

  it("should accept valid main block with strength exercises", () => {
    const validBlock = {
      id: "w1d1_main",
      type: "main",
      title: "Upper body workout",
      exercises: [
        {
          id: "ex1",
          type: "strength-set",
          title: "Bench Press",
          sets: 4,
          reps: "8-10",
          rest_sec: 120,
          muscleGroups: ["chest", "triceps"],
        },
      ],
    };

    expect(() => BlockSchema.parse(validBlock)).not.toThrow();
  });

  it("should accept valid main block with cardio exercises", () => {
    const validBlock = {
      id: "w1d5_main",
      type: "main",
      title: "Steady-state run",
      exercises: [
        {
          id: "ex1",
          type: "cardio-steady-running",
          title: "Easy run",
          duration_sec: 1800,
          target_pace_sec_per_km: 330,
          location: "outdoor",
        },
      ],
    };

    expect(() => BlockSchema.parse(validBlock)).not.toThrow();
  });

  it("should REJECT block with cardio type instead of main", () => {
    const invalidBlock = {
      id: "w1d5_main",
      type: "cardio-steady-running", // ❌ WRONG - this is exercise type, not block type
      title: "Steady-state run",
      exercises: [
        {
          id: "ex1",
          type: "cardio-steady-running",
          title: "Easy run",
          duration_sec: 1800,
        },
      ],
    };

    expect(() => BlockSchema.parse(invalidBlock)).toThrow();
  });

  it("should REJECT block with invalid type", () => {
    const invalidBlock = {
      id: "w1d1_main",
      type: "strength", // ❌ WRONG - not a valid block type
      title: "Workout",
      exercises: [],
    };

    expect(() => BlockSchema.parse(invalidBlock)).toThrow();
  });
});

describe("ExerciseSchema validation", () => {
  it("should accept valid strength-set exercise", () => {
    const validExercise = {
      id: "ex1",
      type: "strength-set",
      title: "Squat",
      sets: 3,
      reps: "10",
      rest_sec: 120,
      muscleGroups: ["quads", "glutes"],
    };

    expect(() => ExerciseSchema.parse(validExercise)).not.toThrow();
  });

  it("should accept valid cardio-steady-running exercise", () => {
    const validExercise = {
      id: "ex1",
      type: "cardio-steady-running",
      title: "Easy run",
      duration_sec: 1800,
      target_pace_sec_per_km: 330,
      location: "outdoor",
    };

    expect(() => ExerciseSchema.parse(validExercise)).not.toThrow();
  });

  it("should accept valid mind-body-pose exercise", () => {
    const validExercise = {
      id: "ex1",
      type: "mind-body-pose",
      title: "Child's Pose",
      duration_sec: 90,
      breathing: "deep",
    };

    expect(() => ExerciseSchema.parse(validExercise)).not.toThrow();
  });

  it("should REJECT exercise with invalid type", () => {
    const invalidExercise = {
      id: "ex1",
      type: "cardio-running", // ❌ WRONG - not exact type name
      title: "Run",
      duration_sec: 1800,
    };

    expect(() => ExerciseSchema.parse(invalidExercise)).toThrow();
  });

  it("should REJECT exercise with block type instead of exercise type", () => {
    const invalidExercise = {
      id: "ex1",
      type: "main", // ❌ WRONG - this is block type, not exercise type
      title: "Workout",
    };

    expect(() => ExerciseSchema.parse(invalidExercise)).toThrow();
  });
});
