/**
 * Validation utilities for workout program generation
 * Ensures generated programs meet quality standards
 */

import type { WorkoutDay, WorkoutWeek } from "./schemas";

/**
 * Muscle group categories for validation
 */
const PUSH_MUSCLES = [
  "chest",
  "shoulders",
  "triceps",
  "anterior deltoid",
  "pectorals",
  "front delts",
];

const PULL_MUSCLES = [
  "back",
  "biceps",
  "rear deltoid",
  "rear delts",
  "lats",
  "traps",
  "rhomboids",
];

const QUAD_MUSCLES = ["quadriceps", "quads", "front thigh"];

const HIP_MUSCLES = ["glutes", "hamstrings", "posterior chain", "hip flexors"];

const CORE_MUSCLES = ["core", "abs", "obliques", "lower back"];

/**
 * Validate muscle group balance for a single workout day
 */
export function validateMuscleBalance(day: WorkoutDay): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Extract all exercises from main block
  const mainBlock = day.blocks.find((b) => b.type === "main");
  if (!mainBlock) {
    return {
      valid: true,
      issues: [],
      suggestions: [],
    };
  }

  const exercises = mainBlock.exercises.filter(
    (ex) => ex.type === "strength-set"
  );

  if (exercises.length === 0) {
    return {
      valid: true,
      issues: [],
      suggestions: [],
    };
  }

  // Count muscle groups
  let pushCount = 0;
  let pullCount = 0;
  let quadCount = 0;
  let hipCount = 0;
  let coreCount = 0;

  exercises.forEach((ex) => {
    if (ex.type !== "strength-set") return;

    const muscleGroups = ex.muscleGroups?.map((m) => m.toLowerCase()) || [];

    if (muscleGroups.some((m) => PUSH_MUSCLES.includes(m))) pushCount++;
    if (muscleGroups.some((m) => PULL_MUSCLES.includes(m))) pullCount++;
    if (muscleGroups.some((m) => QUAD_MUSCLES.includes(m))) quadCount++;
    if (muscleGroups.some((m) => HIP_MUSCLES.includes(m))) hipCount++;
    if (muscleGroups.some((m) => CORE_MUSCLES.includes(m))) coreCount++;
  });

  // Determine workout type from activity
  const activityType = day.activityType.toLowerCase();
  const descriptiveType = (day.activityTypeDescriptive || "").toLowerCase();
  const typeToCheck = descriptiveType || activityType;

  const isUpperBody = typeToCheck.includes("upper");
  const isLowerBody = typeToCheck.includes("lower");
  const isFullBody = typeToCheck.includes("full body");

  // Validate based on workout type
  if (isUpperBody) {
    // Upper body should have balanced push/pull
    if (pushCount === 0) {
      issues.push(
        "No push exercises (chest/shoulders/triceps) in upper body day"
      );
      suggestions.push("Add chest press, shoulder press, or tricep exercise");
    }

    if (pullCount === 0) {
      issues.push("No pull exercises (back/biceps) in upper body day");
      suggestions.push("Add lat pulldown, row, or bicep exercise");
    }

    if (Math.abs(pushCount - pullCount) > 1) {
      issues.push(
        `Push/pull imbalance: ${pushCount} push vs ${pullCount} pull exercises`
      );
      suggestions.push(
        pushCount > pullCount
          ? "Add 1 pull exercise (row, pulldown, curl)"
          : "Add 1 push exercise (press, fly, extension)"
      );
    }
  } else if (isLowerBody) {
    // Lower body should have quad and hip work
    if (quadCount === 0) {
      issues.push("No quad-dominant exercises in lower body day");
      suggestions.push("Add squats, leg press, or lunges");
    }

    if (hipCount === 0) {
      issues.push("No hip-dominant exercises in lower body day");
      suggestions.push("Add deadlifts, hip thrusts, or glute bridges");
    }
  } else if (isFullBody) {
    // Full body should have all major groups
    if (pushCount === 0) {
      issues.push("No upper push in full body workout");
      suggestions.push("Add push-up, chest press, or shoulder press");
    }

    if (pullCount === 0) {
      issues.push("No upper pull in full body workout");
      suggestions.push("Add row, pulldown, or pull-up");
    }

    if (quadCount === 0) {
      issues.push("No lower push (quads) in full body workout");
      suggestions.push("Add squats, leg press, or lunges");
    }

    if (hipCount === 0) {
      issues.push("No lower pull (hip dominant) in full body workout");
      suggestions.push("Add deadlifts, hip thrusts, or glute bridges");
    }

    if (coreCount === 0) {
      suggestions.push("Consider adding 1 core exercise (planks, ab work)");
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Validate progression across weeks
 */
export function validateProgression(weeks: WorkoutWeek[]): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (weeks.length < 2) {
    return {
      valid: true,
      issues: [],
      suggestions: [],
    };
  }

  // Track exercises across weeks to detect progression
  const exerciseTracking: Record<
    string,
    {
      week: number;
      sets?: number;
      reps?: string;
      weight?: number;
      rest?: number;
    }[]
  > = {};

  weeks.forEach((week) => {
    week.days.forEach((day) => {
      const mainBlock = day.blocks.find((b) => b.type === "main");
      if (!mainBlock) return;

      mainBlock.exercises.forEach((ex) => {
        if (ex.type !== "strength-set") return;

        const key = ex.title.toLowerCase();
        if (!exerciseTracking[key]) {
          exerciseTracking[key] = [];
        }

        exerciseTracking[key].push({
          week: week.weekNumber,
          sets: ex.sets ?? undefined,
          reps: ex.reps ?? undefined,
          weight: ex.weight_kg ?? undefined,
          rest: ex.rest_sec ?? undefined,
        });
      });
    });
  });

  // Check for progression in tracked exercises
  let exercisesWithProgression = 0;
  let totalTrackedExercises = 0;

  Object.entries(exerciseTracking).forEach(([title, history]) => {
    if (history.length < 2) return;

    totalTrackedExercises++;
    let hasProgression = false;

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];

      // Check if any parameter increased
      if (
        (curr.weight && prev.weight && curr.weight > prev.weight) ||
        (curr.sets && prev.sets && curr.sets > prev.sets) ||
        (curr.rest && prev.rest && curr.rest < prev.rest)
      ) {
        hasProgression = true;
        break;
      }
    }

    if (hasProgression) {
      exercisesWithProgression++;
    }
  });

  // Calculate progression percentage
  const progressionPercentage =
    totalTrackedExercises > 0
      ? (exercisesWithProgression / totalTrackedExercises) * 100
      : 0;

  if (progressionPercentage < 50) {
    issues.push(
      `Only ${Math.round(progressionPercentage)}% of exercises show progression across weeks`
    );
    suggestions.push(
      "Ensure weight, sets, or reps increase week-to-week for most exercises"
    );
    suggestions.push(
      'Add "progression_notes" field to exercises to document changes'
    );
  }

  // Check for week focus field
  const weeksWithoutFocus = weeks.filter(
    (w) => !w.focus || w.focus.trim() === ""
  );
  if (weeksWithoutFocus.length > 0) {
    issues.push(
      `${weeksWithoutFocus.length} week(s) missing focus field: weeks ${weeksWithoutFocus.map((w) => w.weekNumber).join(", ")}`
    );
    suggestions.push(
      "Add inspiring focus descriptions to all weeks (e.g., 'Foundation: build technique')"
    );
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Validate superset implementation
 */
export function validateSupersets(
  weeks: WorkoutWeek[],
  requiredPercentage: number
): {
  valid: boolean;
  actualPercentage: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  let totalExercises = 0;
  let supersetExercises = 0;

  weeks.forEach((week) => {
    week.days.forEach((day) => {
      day.blocks.forEach((block) => {
        if (block.type === "main") {
          block.exercises.forEach((ex) => {
            if (ex.type === "strength-set") {
              totalExercises++;
              if ("superset_group" in ex && ex.superset_group) {
                supersetExercises++;
              }
            }
          });
        }
      });
    });
  });

  const actualPercentage =
    totalExercises > 0
      ? Math.round((supersetExercises / totalExercises) * 100)
      : 0;

  if (actualPercentage < requiredPercentage - 20) {
    issues.push(
      `Superset percentage too low: ${actualPercentage}% (required: ${requiredPercentage}%)`
    );
    suggestions.push(
      "Add superset_group field to more exercises in main blocks"
    );
    suggestions.push(
      "Pair exercises: antagonist muscles (chest+back) or upper+lower body"
    );
  }

  return {
    valid: actualPercentage >= requiredPercentage - 20,
    actualPercentage,
    issues,
    suggestions,
  };
}

/**
 * Validate rest times by fitness level
 */
export function validateRestTimes(
  day: WorkoutDay,
  fitnessLevel: "beginner" | "intermediate" | "advanced"
): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const mainBlock = day.blocks.find((b) => b.type === "main");
  if (!mainBlock) {
    return { valid: true, issues: [], suggestions: [] };
  }

  // Expected rest times by level
  const expectedRest = {
    beginner: { compound: [120, 180], isolation: [90, 120], core: [60, 90] },
    intermediate: { compound: [90, 120], isolation: [60, 90], core: [45, 60] },
    advanced: { compound: [60, 90], isolation: [45, 60], core: [30, 45] },
  };

  const ranges = expectedRest[fitnessLevel];

  mainBlock.exercises.forEach((ex) => {
    if (ex.type !== "strength-set") return;

    // Skip superset transitions
    if (ex.superset_group && ex.rest_sec === 0) return;

    const isCompound = ex.muscleGroups && ex.muscleGroups.length >= 2;
    const isCore = ex.muscleGroups?.some((m) =>
      CORE_MUSCLES.includes(m.toLowerCase())
    );

    let expectedMin, expectedMax;
    if (isCore) {
      [expectedMin, expectedMax] = ranges.core;
    } else if (isCompound) {
      [expectedMin, expectedMax] = ranges.compound;
    } else {
      [expectedMin, expectedMax] = ranges.isolation;
    }

    if (
      ex.rest_sec != null &&
      (ex.rest_sec < expectedMin - 30 || ex.rest_sec > expectedMax + 30)
    ) {
      issues.push(
        `${ex.title}: rest time ${ex.rest_sec}s outside expected range ${expectedMin}-${expectedMax}s for ${fitnessLevel}`
      );
    }
  });

  if (issues.length > 0) {
    suggestions.push(
      `Adjust rest times to match ${fitnessLevel} level guidelines`
    );
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
}
