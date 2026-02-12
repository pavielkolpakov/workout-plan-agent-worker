/**
 * Tests for workout program validation utilities
 */

import { ActivityType } from "@/types/questionnaire";
import type { WorkoutDay, WorkoutWeek } from "../schemas";
import {
  validateMuscleBalance,
  validateProgression,
  validateRestTimes,
  validateSupersets,
} from "../validation";

// Helper to create test exercises
const createStrengthExercise = (
  id: string,
  title: string,
  muscleGroups: string[],
  options: {
    sets?: number;
    reps?: string;
    weight_kg?: number;
    rest_sec?: number;
    superset_group?: string;
  } = {}
) => ({
  id,
  type: "strength-set" as const,
  title,
  sets: options.sets ?? 3,
  reps: options.reps ?? "10",
  rest_sec: options.rest_sec ?? 120,
  muscleGroups,
  superset_group: options.superset_group,
  weight_kg: options.weight_kg,
});

// Helper to create test day
const createWorkoutDay = (
  activityType: ActivityType,
  dayNumber: number,
  exercises: any[],
  activityTypeDescriptive?: string
): WorkoutDay => ({
  dayNumber,
  activityType,
  activityTypeDescriptive,
  blocks: [
    {
      id: "block_main",
      type: "main",
      title: "Main Workout",
      exercises,
    },
  ],
});

// Helper to create test week
const createWeek = (weekNumber: number, exercises: any[]): WorkoutWeek => ({
  weekNumber,
  focus: `Week ${weekNumber}`,
  days: [
    {
      dayNumber: 1,
      activityType: "gym",
      blocks: [
        {
          id: "block_main",
          type: "main",
          title: "Main",
          exercises,
        },
      ],
    },
  ],
});

describe("validateMuscleBalance", () => {
  describe("Upper Body Days", () => {
    it("should pass with balanced push/pull exercises", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_1", "Bench Press", ["chest", "triceps"]),
          createStrengthExercise("ex_2", "Shoulder Press", ["shoulders"]),
          createStrengthExercise("ex_3", "Lat Pulldown", ["back", "biceps"]),
          createStrengthExercise("ex_4", "Row", ["back"]),
        ],
        "Upper Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should fail with imbalanced push/pull (too many push)", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_1", "Bench Press", ["chest"]),
          createStrengthExercise("ex_2", "Shoulder Press", ["shoulders"]),
          createStrengthExercise("ex_3", "Tricep Extension", ["triceps"]),
          createStrengthExercise("ex_4", "Row", ["back"]),
        ],
        "Upper Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.suggestions.some((s) => s.includes("pull exercise"))).toBe(
        true
      );
    });

    it("should fail with no pull exercises", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_1", "Bench Press", ["chest"]),
          createStrengthExercise("ex_2", "Shoulder Press", ["shoulders"]),
        ],
        "Upper Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("No pull exercises"))).toBe(
        true
      );
    });

    it("should fail with no push exercises", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_1", "Row", ["back"]),
          createStrengthExercise("ex_2", "Bicep Curl", ["biceps"]),
        ],
        "Upper Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("No push exercises"))).toBe(
        true
      );
    });
  });

  describe("Lower Body Days", () => {
    it("should pass with quad and hip dominant exercises", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_1", "Squat", ["quadriceps", "glutes"]),
          createStrengthExercise("ex_2", "Leg Press", ["quadriceps"]),
          createStrengthExercise("ex_3", "Romanian Deadlift", ["hamstrings"]),
          createStrengthExercise("ex_4", "Calf Raise", ["calves"]),
        ],
        "Lower Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(true);
    });

    it("should fail with no quad exercises", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_1", "Deadlift", ["hamstrings", "glutes"]),
          createStrengthExercise("ex_2", "Glute Bridge", ["glutes"]),
        ],
        "Lower Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("No quad-dominant"))).toBe(
        true
      );
    });

    it("should fail with no hip dominant exercises", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_1", "Squat", ["quadriceps"]),
          createStrengthExercise("ex_2", "Leg Extension", ["quadriceps"]),
        ],
        "Lower Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("No hip-dominant"))).toBe(
        true
      );
    });
  });

  describe("Full Body Days", () => {
    it("should pass with all major muscle groups", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_1", "Push-up", ["chest"]),
          createStrengthExercise("ex_2", "Row", ["back"]),
          createStrengthExercise("ex_3", "Squat", ["quadriceps"]),
          createStrengthExercise("ex_4", "Deadlift", ["hamstrings"]),
          createStrengthExercise("ex_5", "Plank", ["core"]),
        ],
        "Full Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(true);
    });

    it("should fail with missing upper push", () => {
      const day = createWorkoutDay(
        "gym",
        1,
        [
          createStrengthExercise("ex_2", "Row", ["back"]),
          createStrengthExercise("ex_3", "Squat", ["quadriceps"]),
          createStrengthExercise("ex_4", "Deadlift", ["hamstrings"]),
        ],
        "Full Body"
      );

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("No upper push"))).toBe(true);
    });
  });

  describe("Non-strength workouts", () => {
    it("should pass for cardio-only workouts", () => {
      const day: WorkoutDay = {
        dayNumber: 1,
        activityType: "running",
        blocks: [
          {
            id: "block_main",
            type: "main",
            title: "Running",
            exercises: [
              {
                id: "ex_run",
                type: "cardio-steady-running",
                title: "5K Run",
                duration_sec: 1800,
              },
            ],
          },
        ],
      };

      const result = validateMuscleBalance(day);
      expect(result.valid).toBe(true);
    });
  });
});

describe("validateProgression", () => {
  it("should detect weight progression across weeks", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "Bench Press", ["chest"], {
          weight_kg: 60,
        }),
      ]),
      createWeek(2, [
        createStrengthExercise("ex_2", "Bench Press", ["chest"], {
          weight_kg: 63,
        }),
      ]),
    ];

    const result = validateProgression(weeks);
    expect(result.valid).toBe(true);
  });

  it("should detect sets progression", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "Squat", ["quadriceps"], { sets: 3 }),
      ]),
      createWeek(2, [
        createStrengthExercise("ex_2", "Squat", ["quadriceps"], { sets: 4 }),
      ]),
    ];

    const result = validateProgression(weeks);
    expect(result.valid).toBe(true);
  });

  it("should detect rest time reduction (density progression)", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "Row", ["back"], { rest_sec: 120 }),
      ]),
      createWeek(2, [
        createStrengthExercise("ex_2", "Row", ["back"], { rest_sec: 90 }),
      ]),
    ];

    const result = validateProgression(weeks);
    expect(result.valid).toBe(true);
  });

  it("should fail when no progression evident", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "Bench Press", ["chest"], {
          weight_kg: 60,
          sets: 3,
        }),
      ]),
      createWeek(2, [
        createStrengthExercise("ex_2", "Bench Press", ["chest"], {
          weight_kg: 60,
          sets: 3,
        }),
      ]),
      createWeek(3, [
        createStrengthExercise("ex_3", "Bench Press", ["chest"], {
          weight_kg: 60,
          sets: 3,
        }),
      ]),
    ];

    const result = validateProgression(weeks);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("should fail when weeks missing focus field", () => {
    const weeks: WorkoutWeek[] = [
      {
        weekNumber: 1,
        focus: "", // Empty focus
        days: [
          {
            dayNumber: 1,
            activityType: "gym",
            blocks: [
              {
                id: "main",
                type: "main",
                title: "Main",
                exercises: [
                  createStrengthExercise("ex_1", "Test", ["chest"], {
                    weight_kg: 60,
                  }),
                ],
              },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        focus: "", // Empty focus
        days: [
          {
            dayNumber: 1,
            activityType: "gym",
            blocks: [
              {
                id: "main",
                type: "main",
                title: "Main",
                exercises: [
                  createStrengthExercise("ex_2", "Test", ["chest"], {
                    weight_kg: 63,
                  }),
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = validateProgression(weeks);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes("missing focus field"))).toBe(
      true
    );
  });
});

describe("validateSupersets", () => {
  it("should pass when superset percentage met", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "Exercise A", ["chest"], {
          superset_group: "A",
          rest_sec: 0,
        }),
        createStrengthExercise("ex_2", "Exercise B", ["back"], {
          superset_group: "A",
          rest_sec: 120,
        }),
        createStrengthExercise("ex_3", "Exercise C", ["legs"], {
          superset_group: "B",
          rest_sec: 0,
        }),
        createStrengthExercise("ex_4", "Exercise D", ["shoulders"], {
          superset_group: "B",
          rest_sec: 120,
        }),
      ]),
    ];

    const result = validateSupersets(weeks, 75); // Require 75%
    expect(result.valid).toBe(true);
    expect(result.actualPercentage).toBe(100); // All 4 exercises in supersets
  });

  it("should fail when superset percentage too low", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "Exercise A", ["chest"], {
          superset_group: "A",
        }),
        createStrengthExercise("ex_2", "Exercise B", ["back"]),
        createStrengthExercise("ex_3", "Exercise C", ["legs"]),
        createStrengthExercise("ex_4", "Exercise D", ["shoulders"]),
      ]),
    ];

    const result = validateSupersets(weeks, 75); // Require 75%
    expect(result.valid).toBe(false);
    expect(result.actualPercentage).toBe(25); // Only 1/4 in supersets
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("should calculate correct percentage", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "A", ["chest"], {
          superset_group: "A",
        }),
        createStrengthExercise("ex_2", "B", ["back"], { superset_group: "A" }),
        createStrengthExercise("ex_3", "C", ["legs"]),
        createStrengthExercise("ex_4", "D", ["shoulders"]),
      ]),
    ];

    const result = validateSupersets(weeks, 50);
    expect(result.actualPercentage).toBe(50); // 2/4 = 50%
    expect(result.valid).toBe(true);
  });
});

describe("validateRestTimes", () => {
  describe("Beginner level", () => {
    it("should pass with correct rest times for compounds", () => {
      const day = createWorkoutDay("gym", 1, [
        createStrengthExercise("ex_1", "Squat", ["quadriceps", "glutes"], {
          rest_sec: 150,
        }),
      ]);

      const result = validateRestTimes(day, "beginner");
      expect(result.valid).toBe(true);
    });

    it("should fail with too short rest for beginner", () => {
      const day = createWorkoutDay("gym", 1, [
        createStrengthExercise("ex_1", "Squat", ["quadriceps", "glutes"], {
          rest_sec: 60,
        }),
      ]);

      const result = validateRestTimes(day, "beginner");
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe("Advanced level", () => {
    it("should pass with shorter rest times", () => {
      const day = createWorkoutDay("gym", 1, [
        createStrengthExercise("ex_1", "Squat", ["quadriceps", "glutes"], {
          rest_sec: 75,
        }),
      ]);

      const result = validateRestTimes(day, "advanced");
      expect(result.valid).toBe(true);
    });

    it("should allow very short rest for advanced core work", () => {
      const day = createWorkoutDay("gym", 1, [
        createStrengthExercise("ex_1", "Plank", ["core"], { rest_sec: 30 }),
      ]);

      const result = validateRestTimes(day, "advanced");
      expect(result.valid).toBe(true);
    });
  });

  describe("Supersets", () => {
    it("should allow zero rest for superset transitions", () => {
      const day = createWorkoutDay("gym", 1, [
        createStrengthExercise("ex_1", "Exercise A", ["chest"], {
          superset_group: "A",
          rest_sec: 0,
        }),
        createStrengthExercise("ex_2", "Exercise B", ["back"], {
          superset_group: "A",
          rest_sec: 120,
        }),
      ]);

      const result = validateRestTimes(day, "intermediate");
      expect(result.valid).toBe(true);
    });
  });
});

describe("validateProgression - comprehensive scenarios", () => {
  it("should detect mixed progression strategies", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "Bench Press", ["chest"], {
          weight_kg: 60,
          sets: 3,
        }),
        createStrengthExercise("ex_2", "Squat", ["quadriceps"], {
          weight_kg: 80,
          sets: 3,
        }),
      ]),
      createWeek(2, [
        createStrengthExercise("ex_3", "Bench Press", ["chest"], {
          weight_kg: 60,
          sets: 4,
        }), // +sets
        createStrengthExercise("ex_4", "Squat", ["quadriceps"], {
          weight_kg: 84,
          sets: 3,
        }), // +weight
      ]),
    ];

    const result = validateProgression(weeks);
    expect(result.valid).toBe(true);
  });

  it("should handle single week programs", () => {
    const weeks = [
      createWeek(1, [createStrengthExercise("ex_1", "Bench Press", ["chest"])]),
    ];

    const result = validateProgression(weeks);
    expect(result.valid).toBe(true); // Can't validate progression with 1 week
  });

  it("should detect progression in some but not all exercises", () => {
    const weeks = [
      createWeek(1, [
        createStrengthExercise("ex_1", "Exercise A", ["chest"], {
          weight_kg: 60,
        }),
        createStrengthExercise("ex_2", "Exercise B", ["back"], {
          weight_kg: 70,
        }),
        createStrengthExercise("ex_3", "Exercise C", ["legs"], {
          weight_kg: 80,
        }),
        createStrengthExercise("ex_4", "Exercise D", ["shoulders"], {
          weight_kg: 40,
        }),
      ]),
      createWeek(2, [
        createStrengthExercise("ex_5", "Exercise A", ["chest"], {
          weight_kg: 63,
        }), // Progressed
        createStrengthExercise("ex_6", "Exercise B", ["back"], {
          weight_kg: 70,
        }), // Same
        createStrengthExercise("ex_7", "Exercise C", ["legs"], {
          weight_kg: 80,
        }), // Same
        createStrengthExercise("ex_8", "Exercise D", ["shoulders"], {
          weight_kg: 40,
        }), // Same
      ]),
    ];

    const result = validateProgression(weeks);
    // Only 1/4 (25%) show progression - should fail
    expect(result.valid).toBe(false);
  });
});

describe("Integration: Multiple validations", () => {
  it("should validate a complete program", () => {
    const weeks: WorkoutWeek[] = [
      {
        weekNumber: 1,
        focus: "Foundation: build technique and controlled hypertrophy",
        days: [
          {
            dayNumber: 1,
            activityType: "gym",
            blocks: [
              {
                id: "main",
                type: "main",
                title: "Main",
                exercises: [
                  createStrengthExercise(
                    "ex_1",
                    "Bench Press",
                    ["chest", "triceps"],
                    { weight_kg: 60, rest_sec: 120 }
                  ),
                  createStrengthExercise("ex_2", "Row", ["back", "biceps"], {
                    weight_kg: 70,
                    rest_sec: 120,
                  }),
                ],
              },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        focus: "Progression: increase volume slightly",
        days: [
          {
            dayNumber: 1,
            activityType: "gym",
            blocks: [
              {
                id: "main",
                type: "main",
                title: "Main",
                exercises: [
                  createStrengthExercise(
                    "ex_3",
                    "Bench Press",
                    ["chest", "triceps"],
                    { weight_kg: 63, rest_sec: 120 }
                  ), // Progressed
                  createStrengthExercise("ex_4", "Row", ["back", "biceps"], {
                    weight_kg: 73,
                    rest_sec: 120,
                  }), // Progressed
                ],
              },
            ],
          },
        ],
      },
    ];

    // Validate muscle balance
    const muscleBalance = validateMuscleBalance(weeks[0].days[0]);
    expect(muscleBalance.valid).toBe(true);

    // Validate progression
    const progression = validateProgression(weeks);
    expect(progression.valid).toBe(true);

    // Validate rest times
    const restTimes = validateRestTimes(weeks[0].days[0], "intermediate");
    expect(restTimes.valid).toBe(true);
  });
});

describe("Edge Cases", () => {
  it("should handle empty exercise arrays gracefully", () => {
    const day: WorkoutDay = {
      dayNumber: 1,
      activityType: "gym",
      blocks: [],
    };

    const result = validateMuscleBalance(day);
    expect(result.valid).toBe(true);
  });

  it("should handle mixed exercise types", () => {
    const day: WorkoutDay = {
      dayNumber: 1,
      activityType: "gym",
      activityTypeDescriptive: "Full Body",
      blocks: [
        {
          id: "main",
          type: "main",
          title: "Main",
          exercises: [
            createStrengthExercise("ex_1", "Squat", ["quadriceps"]),
            {
              id: "ex_2",
              type: "cardio-interval",
              title: "Sprints",
              work_sec: 30,
              rest_sec: 30,
              rounds: 8,
            },
          ],
        },
      ],
    };

    const result = validateMuscleBalance(day);
    // Should only check strength exercises, but still needs full body balance
    expect(result.valid).toBe(false); // Missing upper push, pull, lower pull
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
