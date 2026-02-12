# AI Agent Testing Strategy (Updated Architecture)

**Current (2026-02-04):** We use **simple AI tests** only: `simple.ai.test.ts` (nutrition, sleep, steps) and `week-simple.ai.test.ts` (workout). Full test run: 107 tests. See [README.md](./README.md) and [QUICK-START.md](./QUICK-START.md).

## 🏗️ Architecture Overview

After refactoring to **TypeScript-controlled Orchestrator-Worker pattern**:

```
generateWorkoutProgram (Orchestrator)
  ├─ Generates Plan (AI streaming)
  ├─ Executes sequentially:
  │   ├─ agentWeek(week 1)  ← Worker Agent
  │   ├─ agentWeek(week 2)  ← Worker Agent
  │   ├─ agentWeek(week 3)  ← Worker Agent
  │   └─ agentWeek(week 4)  ← Worker Agent
  └─ Executes in parallel:
      ├─ agentNutrition()   ← Worker Agent
      ├─ agentSleep()       ← Worker Agent
      └─ agentSteps()       ← Worker Agent
```

**Key Changes:**

- ✅ No AI tools - direct agent function calls
- ✅ TypeScript controls execution flow
- ✅ Each agent is independently testable
- ✅ Orchestrator coordinates, agents execute

---

## 📛 Test Naming Convention

**CRITICAL:** All tests that call AI models MUST use `.ai.test.ts` suffix!

- ✅ `.ai.test.ts` - Tests that call AI (agentWeek, agentNutrition, etc.)
- ✅ `.test.ts` - Pure unit tests (calculations, validations, etc.)

**Why?**

- AI tests are slow (5-60 seconds per test)
- AI tests cost money (API usage)
- CI/CD can skip AI tests for fast feedback
- Developers can run fast tests locally

---

## 🧪 Test Levels

### Level 1: AI Tests (Agent Isolation)

Test each agent individually with real AI calls.

**Benefits:**

- ✅ Fast execution
- ✅ Predictable results
- ✅ Easy to debug
- ✅ Test edge cases thoroughly

**agentWeek Unit Tests:**

```typescript
import { agentWeek } from "@/agents/workout-program/week-agent";

describe("agentWeek - Unit Tests", () => {
  it("should generate week 1 for beginner", async () => {
    const context = {
      weekNumber: 1,
      weeksTotal: 4,
      questionnaireData: createBeginnerProfile(),
      trainingFrequency: 3,
      trainingDuration: 45,
      activities: ["gym"],
      fitnessGoal: "build-muscles",
      previousWeeks: [], // First week
    };

    const week = await agentWeek(context);

    expect(week.days).toHaveLength(3);
    expect(week.weekNumber).toBe(1);
    expect(week.focus).toContain("baseline");
  });

  it("should apply progressive overload in week 4", async () => {
    const context = {
      weekNumber: 4,
      weeksTotal: 4,
      questionnaireData: createProfile(),
      trainingFrequency: 3,
      trainingDuration: 45,
      activities: ["gym"],
      fitnessGoal: "build-muscles",
      previousWeeks: [week1, week2, week3], // Has history
    };

    const week4 = await agentWeek(context);

    // Should have higher intensity than week 1
    expect(week4.difficulty).not.toBe(week1.difficulty);
  });
});
```

**agentNutrition Unit Tests:**

```typescript
import { agentNutrition } from "@/agents/nutrition/agent";

describe("agentNutrition - Unit Tests", () => {
  it("should calculate calorie deficit for weight loss", async () => {
    const result = await agentNutrition({
      questionnaireData: createWeightLossProfile(),
    });

    expect(result.plan.baseline.dailyCalories).toBeLessThan(tdee);
    expect(result.plan.macroSplit.protein_percent).toBe(40); // High protein for weight loss
  });

  it("should adjust macros for muscle building", async () => {
    const result = await agentNutrition({
      questionnaireData: createMuscleBuildingProfile(),
    });

    expect(result.plan.macroSplit.carbs_percent).toBe(45); // Higher carbs
    expect(result.plan.macroSplit.protein_percent).toBe(30);
  });
});
```

**agentSleep Unit Tests:**

```typescript
import { agentSleep } from "@/agents/sleep/agent";

describe("agentSleep - Unit Tests", () => {
  it("should recommend 8+ hours for beginners", async () => {
    const result = await agentSleep({
      questionnaireData: createBeginnerProfile(),
    });

    expect(result.schedule.baseline.duration_minutes).toBeGreaterThanOrEqual(
      480
    );
  });

  it("should adjust sleep for high training volume", async () => {
    const mockWorkout = createHighVolumeWorkout();

    const result = await agentSleep({
      questionnaireData: createProfile(),
      workoutProgram: mockWorkout,
    });

    // Should recommend more sleep on training days
    const trainingDays = result.schedule.dailyAdjustments?.filter(
      (d) => d.isTrainingDay
    );
    expect(trainingDays?.[0].adjustedDuration_minutes).toBeGreaterThan(
      result.schedule.baseline.duration_minutes
    );
  });
});
```

**agentSteps Unit Tests:**

```typescript
import { agentSteps } from "@/agents/steps/agent";

describe("agentSteps - Unit Tests", () => {
  it("should increase steps for weight loss", async () => {
    const result = await agentSteps({
      questionnaireData: createWeightLossProfile(),
    });

    expect(result.stepsTarget.dailyStepsGoal).toBeGreaterThan(10000);
    expect(result.stepsTarget.reasoning).toContain("weight loss");
  });

  it("should reduce steps for muscle building", async () => {
    const result = await agentSteps({
      questionnaireData: createMuscleBuildingProfile(),
    });

    expect(result.stepsTarget.dailyStepsGoal).toBeLessThan(10000);
    expect(result.stepsTarget.reasoning).toContain("recovery");
  });
});
```

---

### Level 2: Integration Tests (Orchestrator)

Test the full orchestrator flow with all agents.

**Benefits:**

- ✅ Tests real user flow
- ✅ Verifies agent coordination
- ✅ Tests parallel execution
- ✅ End-to-end validation

```typescript
import { generateWorkoutProgram } from "@/agents/workout-program/agent";

describe("generateWorkoutProgram - Integration Tests", () => {
  jest.setTimeout(240000); // 4 min for full generation

  it("should generate complete fitness program", async () => {
    const profile = createIntermediateProfile();

    const result = await generateWorkoutProgram({
      questionnaireData: profile,
      onProgress: (event) => {
        console.log(`Progress: ${event.currentComponent}`);
      },
    });

    // Verify orchestrator completed all steps
    expect(result.program.weeks).toHaveLength(4);
    expect(result.program.summary).toBeDefined();

    // Verify all components generated
    expect(result.metadata?.componentsGenerated).toContain("workout");
    expect(result.metadata?.componentsGenerated).toContain("nutrition");
    expect(result.metadata?.componentsGenerated).toContain("sleep");
    expect(result.metadata?.componentsGenerated).toContain("steps");
  });

  it("should stream plan updates to UI", async () => {
    const planUpdates: any[] = [];

    await generateWorkoutProgram({
      questionnaireData: createProfile(),
      onProgress: (event) => {
        if (event.type === "plan-created") {
          planUpdates.push(event.plan);
        }
      },
    });

    expect(planUpdates.length).toBeGreaterThan(0);
    expect(planUpdates[0].steps).toBeDefined();
  });

  it("should execute weeks sequentially", async () => {
    const weekNumbers: number[] = [];

    await generateWorkoutProgram({
      questionnaireData: createProfile(),
      onProgress: (event) => {
        if (event.type === "week-generated") {
          weekNumbers.push(event.weekNumber);
        }
      },
    });

    // Weeks should be generated in order
    expect(weekNumbers).toEqual([1, 2, 3, 4]);
  });

  it("should execute components in parallel", async () => {
    const timestamps: Record<string, number> = {};

    await generateWorkoutProgram({
      questionnaireData: createProfile(),
      onProgress: (event) => {
        if (
          [
            "nutrition-generated",
            "sleep-generated",
            "steps-generated",
          ].includes(event.type)
        ) {
          timestamps[event.currentComponent] = Date.now();
        }
      },
    });

    // All components should complete around the same time (parallel)
    const times = Object.values(timestamps);
    const maxDiff = Math.max(...times) - Math.min(...times);
    expect(maxDiff).toBeLessThan(5000); // Within 5 seconds
  });
});
```

---

### Level 3: E2E Tests (Store Integration)

Test with Zustand store updates.

```typescript
import { generateWorkoutProgram } from "@/agents/workout-program/agent";
import { useWorkoutStore } from "@/stores/workout-store";

describe("Store Integration E2E", () => {
  beforeEach(() => {
    useWorkoutStore.getState().reset();
  });

  it("should update store incrementally during generation", async () => {
    const store = useWorkoutStore.getState();
    const snapshots: number[] = [];

    useWorkoutStore.subscribe((state) => {
      if (state.program.weeks.length > 0) {
        snapshots.push(state.program.weeks.length);
      }
    });

    await generateWorkoutProgram({
      questionnaireData: createProfile(),
    });

    // Store should be updated incrementally (1 → 2 → 3 → 4)
    expect(snapshots).toEqual([1, 2, 3, 4]);
  });
});
```

---

## 📁 Recommended Test Structure

**Naming Convention:**

- `.ai.test.ts` - Tests that call AI (slow, requires API keys)
- `.test.ts` - Pure unit tests (fast, no AI)

```
agents/
├── workout-program/
│   ├── __tests__/
│   │   ├── week-agent.ai.test.ts        ← AI: agentWeek
│   │   ├── orchestrator.ai.test.ts      ← AI: generateWorkoutProgram
│   │   ├── validation.test.ts           ← Unit: validation (no AI)
│   │   └── superset-logic.test.ts       ← Unit: supersets (no AI)
├── nutrition/
│   ├── __tests__/
│   │   ├── agent.ai.test.ts             ← AI: agentNutrition
│   │   └── calculations.test.ts         ← Unit: helper functions (no AI)
├── sleep/
│   ├── __tests__/
│   │   ├── agent.ai.test.ts             ← AI: agentSleep
│   │   └── calculations.test.ts         ← Unit: helper functions (no AI)
└── steps/
    ├── __tests__/
    │   ├── agent.ai.test.ts             ← AI: agentSteps
    │   └── recommendations.test.ts      ← Unit: helper functions (no AI)
```

---

## 🎯 Testing Priorities

1. **✅ Critical Path (Must Have):**
   - agentWeek: Basic generation, progressive overload
   - agentNutrition: Calorie calculation, macro split
   - agentSleep: Duration calculation, training day adjustments
   - agentSteps: Goal-based targets
   - generateWorkoutProgram: Full flow, error handling

2. **⚠️ Edge Cases (Should Have):**
   - Injuries: contraindicated exercises
   - Extreme scenarios: very high/low frequency
   - Age considerations: seniors, youth
   - Multiple goals: weight loss + muscle building

3. **💡 Nice to Have:**
   - Performance benchmarks
   - AI output quality metrics
   - Token usage tracking

---

## 🚀 Quick Commands

```bash
# Test specific AI agent
npm run test:agents -- agents/workout-program/__tests__/week-agent.ai.test.ts
npm run test:agents -- agents/nutrition/__tests__/agent.ai.test.ts

# Run all AI tests
npm run test:agents -- --testPathPattern="\.ai\.test\.ts$"

# Run only fast unit tests (no AI)
npm run test:agents -- --testPathPattern="\.test\.ts$" --testPathIgnorePatterns="\.ai\.test\.ts$"

# Test with coverage
npm run test:agents:coverage

# Watch mode
npm run test:agents:watch
```

---

## 📊 Coverage Goals

| Component      | Target  | Status            |
| -------------- | ------- | ----------------- |
| agentWeek      | 85%     | 🟡 To implement   |
| agentNutrition | 80%     | 🟡 To implement   |
| agentSleep     | 80%     | 🟡 To implement   |
| agentSteps     | 80%     | 🟡 To implement   |
| Orchestrator   | 90%     | 🟡 To implement   |
| **Overall**    | **85%** | 🔴 ~40% currently |

---

## ✅ Test Checklist

### agentWeek Tests:

- [ ] Generates correct number of days
- [ ] Applies progressive overload
- [ ] Respects fitness level
- [ ] Handles injuries properly
- [ ] Validates block structure (warmup/main/cooldown)
- [ ] Checks exercise order (compounds → isolation)

### agentNutrition Tests:

- [ ] Calculates correct calorie deficit/surplus
- [ ] Applies appropriate macro split
- [ ] Creates meal plan structure
- [ ] Adds hydration recommendations
- [ ] Handles edge cases (extreme weight loss, etc.)

### agentSleep Tests:

- [ ] Recommends appropriate duration
- [ ] Adjusts for training days
- [ ] Considers fitness level
- [ ] Handles age-related changes
- [ ] Provides actionable recommendations

### agentSteps Tests:

- [ ] Sets goal-appropriate targets
- [ ] Adjusts for activity level
- [ ] Considers training volume
- [ ] Provides helpful tips

### Orchestrator Tests:

- [ ] Generates complete plan
- [ ] Executes steps in order (sequential weeks, parallel components)
- [ ] Streams progress events
- [ ] Updates store incrementally
- [ ] Handles errors gracefully

---

Last updated: 2026-02-04
