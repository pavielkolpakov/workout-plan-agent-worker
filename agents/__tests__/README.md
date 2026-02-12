# AI Agent Testing (Updated Architecture)

## ✨ New Testing Architecture

After refactoring to **TypeScript-controlled Orchestrator-Worker pattern**, each agent can now be tested independently!

### What Changed:

- ✅ **Unit Tests**: Test each agent (`agentWeek`, `agentNutrition`, `agentSleep`, `agentSteps`) in isolation
- ✅ **Integration Tests**: Test full orchestrator (`generateWorkoutProgram`) flow
- ✅ **No AI Tools**: Agents are now pure functions - easier to test!
- ✅ **Independent**: Each test doesn't rely on others

---

## 🚀 Quick Start

### Run all agent tests:

```bash
npm run test:agents
```

### Run specific agent (AI tests):

```bash
# Week agent (individual week generation)
npm run test:agents -- agents/workout-program/__tests__/week-simple.ai.test.ts

# Nutrition agent
npm run test:agents -- agents/nutrition/__tests__/simple.ai.test.ts

# Sleep agent
npm run test:agents -- agents/sleep/__tests__/simple.ai.test.ts

# Steps agent
npm run test:agents -- agents/steps/__tests__/simple.ai.test.ts
```

### Run old tests (legacy):

```bash
# All agent folders
npm run test:agents -- agents/nutrition
npm run test:agents -- agents/sleep
npm run test:agents -- agents/steps
npm run test:agents -- agents/workout-program
```

### Development mode (watch):

```bash
npm run test:agents:watch
```

### With coverage report:

```bash
npm run test:agents:coverage
```

---

## 📁 Clean Test Structure (Updated 2026-02-04)

```
agents/
├── workout-program/
│   ├── __tests__/
│   │   ├── week-simple.ai.test.ts       ← ✅ AI: agentWeek (1 test)
│   │   ├── validation.test.ts           ← ✅ Unit: validation (29 tests)
│   │   └── superset-logic.test.ts       ← ✅ Unit: supersets (21 tests)
│   ├── agent.ts                         ← Orchestrator
│   └── week-agent.ts                    ← Week Worker
├── nutrition/
│   ├── __tests__/
│   │   ├── simple.ai.test.ts            ← ✅ AI: agentNutrition (1 test)
│   │   └── nutrition-agent.test.ts      ← ✅ Calculated fallback (14 tests)
│   └── agent.ts
├── sleep/
│   ├── __tests__/
│   │   ├── simple.ai.test.ts            ← ✅ AI: agentSleep (1 test)
│   │   └── sleep-agent.test.ts          ← ✅ Calculated fallback (15 tests)
│   └── agent.ts
└── steps/
    ├── __tests__/
    │   ├── simple.ai.test.ts            ← ✅ AI: agentSteps (1 test)
    │   └── steps-agent.test.ts          ← ✅ Calculated fallback (24 tests)
    └── agent.ts
```

**Naming Convention:**

- `simple.ai.test.ts` / `week-simple.ai.test.ts` - AI tests (1 basic test per agent)
- `.test.ts` - Unit/calculated tests (no AI, fast)

---

## 📁 Old Test Structure (Legacy)

```
agents/
├── nutrition/
│   ├── __tests__/
│   │   └── nutrition-agent.test.ts   ← Integration tests
│   ├── generator.ts
│   └── schemas.ts
├── sleep/
│   ├── __tests__/
│   │   └── sleep-agent.test.ts       ← Integration tests
│   ├── generator.ts
│   └── schemas.ts
├── steps/
│   ├── __tests__/
│   │   └── steps-agent.test.ts       ← Existing tests
│   ├── generator.ts
│   └── recommendations.ts
└── workout-program/
    ├── __tests__/
    │   ├── validation.test.ts        ← Existing tests
    │   └── superset-logic.test.ts    ← Existing tests
    ├── generator.ts
    └── validation.ts
```

---

## 🧪 Test Types

### 1. Unit Tests (Agent Isolation)

Test each agent independently with mocked inputs.

**Example - Week Agent:**

```typescript
import { agentWeek } from "@/agents/workout-program/week-agent";

describe("agentWeek - Unit Tests", () => {
  it("should generate week with correct number of days", async () => {
    const context = {
      weekNumber: 1,
      weeksTotal: 4,
      questionnaireData: createTestProfile(),
      trainingFrequency: 3,
      trainingDuration: 45,
      activities: ["gym"],
      fitnessGoal: "build-muscles",
      previousWeeks: [],
    };

    const week = await agentWeek(context);

    expect(week.days).toHaveLength(3);
    expect(week.weekNumber).toBe(1);
  });
});
```

**Example - Nutrition Agent:**

```typescript
import { agentNutrition } from "@/agents/nutrition/agent";

describe("agentNutrition - Unit Tests", () => {
  it("should calculate calorie deficit for weight loss", async () => {
    const profile = createTestProfile({
      wish: { fitnessGoal: "lose-weight" },
    });

    const result = await agentNutrition({
      questionnaireData: profile,
    });

    expect(result.plan.baseline.dailyCalories).toBeDefined();
    expect(result.plan.macroSplit.protein_percent).toBeGreaterThanOrEqual(35);
  });
});
```

### 2. Integration Tests (Orchestrator)

Test full program generation flow.

**Example:**

```typescript
import { generateWorkoutProgram } from "@/agents/workout-program/agent";

describe("Orchestrator - Integration Tests", () => {
  it("should generate complete fitness program", async () => {
    const result = await generateWorkoutProgram({
      questionnaireData: createTestProfile(),
    });

    expect(result.program.weeks.length).toBeGreaterThan(0);
    expect(result.metadata?.componentsGenerated).toContain("workout");
    expect(result.metadata?.componentsGenerated).toContain("nutrition");
  });
});
```

### 3. Helper Function Tests

Test individual calculation functions.

**Example:**

```typescript
describe("calculateStepsTarget", () => {
  it("should increase steps for weight loss goal", () => {
    const result = calculateStepsTarget(profile);
    expect(result).toBeGreaterThan(10000);
  });
});
```

### 3. Validation Tests

Test that generated data meets expert criteria.

**Example:**

```typescript
describe("validateProgression", () => {
  it("should detect weight progression", () => {
    const result = validateProgression(weeks);
    expect(result.valid).toBe(true);
  });
});
```

---

## 🎯 What Each Test File Tests

### AI Tests (Call AI Models - Simple Validation):

**`week-simple.ai.test.ts`** - Tests `agentWeek()`:

- ✅ Generates week with valid structure (days, blocks, exercises)
- ✅ Verifies schema adherence (no invalid exercise types)

**`simple.ai.test.ts` (nutrition)** - Tests `agentNutrition()`:

- ✅ Generates nutrition plan with baseline, macros, meal plan
- ✅ Verifies all required fields present

**`simple.ai.test.ts` (sleep)** - Tests `agentSleep()`:

- ✅ Generates sleep schedule with duration, bedtime, wake time
- ✅ Verifies realistic values (7-10h)

**`simple.ai.test.ts` (steps)** - Tests `agentSteps()`:

- ✅ Generates steps target with baseline, reasoning, tips
- ✅ Verifies realistic daily goals (5k-15k steps)

### Unit Tests (No AI - Detailed Validation):

All detailed validation moved to calculated/unit tests:

- `validation.test.ts` - muscle balance, progression, rest times
- `superset-logic.test.ts` - superset scoring, recommendations
- `nutrition-agent.test.ts` - calorie calculation, macro split (14 tests)
- `sleep-agent.test.ts` - duration calculation, adjustments (15 tests)
- `steps-agent.test.ts` - target calculation, tips generation (24 tests)

---

## 📋 Test Scenarios Covered

### Typical Users

- ✅ Young male building muscles
- ✅ Female losing weight
- ✅ Middle-aged keep-fit
- ✅ Beginner full body
- ✅ Advanced high frequency

### Edge Cases

- ✅ Minimal time (30min sessions)
- ✅ Senior building strength
- ✅ Extreme weight loss/gain
- ✅ Very high frequency (6x/week)
- ✅ Very low frequency (2x/week)

### Health Conditions

- ✅ Injuries (shoulder, knee, back)
- ✅ Multiple health conditions
- ✅ Senior with limitations

---

## 🔧 Configuration

### Jest Config: `jest.agents.config.js`

- **Preset:** `ts-jest`
- **Environment:** `node` (no React/Expo needed)
- **Roots:** `agents/`
- **Timeout:** 30s (for AI generation)

### Setup: `jest.agents.setup.js`

- Loads `.env.local` for API keys
- Mocks console output
- Custom matchers (e.g., `toBeWithinRange`)

---

## 🎯 Writing Tests

### Template:

```typescript
import { generateXAgent } from "../generator";
import type { QuestionnaireData } from "../../workout-program/types";

const createTestProfile = (overrides?: Partial<QuestionnaireData>) => {
  // ... base profile with overrides
};

describe("X Agent - Integration Tests", () => {
  jest.setTimeout(30000); // 30s for AI generation

  describe("Baseline Calculation", () => {
    it("should calculate correctly", async () => {
      const profile = createTestProfile();
      const result = await generateXAgent({ questionnaireData: profile });

      expect(result).toBeDefined();
      // ... assertions
    });
  });

  describe("Daily Adjustments", () => {
    it("should adjust for training days", async () => {
      // ... test logic
    });
  });

  describe("Edge Cases", () => {
    it("should handle extreme scenario", async () => {
      // ... test logic
    });
  });
});
```

---

## ✅ Best Practices

### 1. Clear Test Names

```typescript
// ✅ Good
it("should increase calories on heavy training days");

// ❌ Bad
it("test calories");
```

### 2. Arrange, Act, Assert

```typescript
// Arrange
const profile = createTestProfile({ age: 68 });

// Act
const result = await generateSleepSchedule({ questionnaireData: profile });

// Assert
expect(result.schedule.baseline.duration_minutes).toBeGreaterThanOrEqual(420);
```

### 3. Test One Thing

```typescript
// ✅ Good - tests one specific behavior
it("should recommend 8h sleep for beginners");

// ❌ Bad - tests multiple things
it("should recommend correct sleep and adjust for training and handle seniors");
```

### 4. Use Helpers

```typescript
// Create reusable helpers
const createTestProfile = (overrides) => {
  /* ... */
};
const validateProteinRange = (protein_g, weight_kg, goal) => {
  /* ... */
};
```

### 5. Mock External Dependencies

```typescript
// Mock workout program for nutrition/sleep tests
const mockWorkout = {
  weeks: [
    {
      weekNumber: 1,
      days: [{ dayNumber: 1, activityType: "Heavy Training", blocks: [] }],
    },
  ],
};
```

---

## 📊 Coverage Goals

| Agent        | Target  | Current Status           |
| ------------ | ------- | ------------------------ |
| Nutrition    | 80%     | 🆕 Ready to test         |
| Sleep        | 80%     | 🆕 Ready to test         |
| Steps        | 85%     | 🟢 Has tests (75%)       |
| Workout      | 90%     | 🟡 Expand existing (85%) |
| Orchestrator | 85%     | 🔴 Needs tests           |
| **Overall**  | **85%** | 🟡 In progress (~40%)    |

---

## 🐛 Debugging Tests

### Run single test:

```bash
npm run test:agents -- -t "should calculate correct calories"
```

### Show console output:

```bash
npm run test:agents -- --verbose
```

### Run with debugger:

```bash
node --inspect-brk node_modules/.bin/jest --config jest.agents.config.js --runInBand
```

---

## 📚 Resources

- **Strategy Doc:** `/docs/testing/AI_AGENT_TESTING_STRATEGY.md`
- **Summary:** `/docs/testing/AI_AGENT_TESTING_SUMMARY.md`
- **Test Profiles:** `/data/test-profiles.ts`
- **Expert Validation:** `/expert-validation/EXPERT-REVIEW-GUIDE.md`

---

## 🔐 Environment Setup

Create `.env.local` with:

```env
OPENAI_API_KEY=sk-...
```

Tests will automatically load this for AI generation.

---

## 🚨 Common Issues

### Issue: Tests timeout

**Solution:** Increase timeout in test file:

```typescript
jest.setTimeout(60000); // 60s
```

### Issue: API rate limits

**Solution:** Run tests sequentially:

```bash
npm run test:agents -- --runInBand
```

### Issue: Module resolution errors

**Solution:** Check `tsconfig.json` paths match `jest.agents.config.js` moduleNameMapper.

---

## 🎉 Happy Testing!

Tests help ensure our AI agents generate safe, effective, and scientifically sound fitness programs! 💪

---

Last updated: 2026-01-25
