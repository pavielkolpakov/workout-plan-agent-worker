# Quick Start - Agent Testing

**Current tests (2026-02-04):** 4 AI tests (`simple.ai.test.ts` + `week-simple.ai.test.ts`), 103 unit/calculated. See [README.md](./README.md) for full list.

## 🚀 Run Tests

### All tests (107):

```bash
npm run test:agents
```

### Only AI tests (4, ~40–50s):

```bash
npm run test:agents -- --testPathPattern="\.ai\.test\.ts$"
```

### Individual AI test:

```bash
npm run test:agents -- agents/workout-program/__tests__/week-simple.ai.test.ts
npm run test:agents -- agents/nutrition/__tests__/simple.ai.test.ts
npm run test:agents -- agents/sleep/__tests__/simple.ai.test.ts
npm run test:agents -- agents/steps/__tests__/simple.ai.test.ts
```

### Unit/calculated only (103, fast):

```bash
npm run test:agents -- --testPathPattern="\.test\.ts$" --testPathIgnorePatterns="\.ai\.test\.ts$"
```

---

## 🧪 Test Structure

**Naming Convention:**

- `.ai.test.ts` - Tests that call AI models (slow, uses API keys)
- `.test.ts` - Pure unit tests (fast, no AI calls)

### AI Tests (Independent Agent Testing)

Each agent can be tested in isolation with real AI:

```typescript
// Test agentWeek with specific context
const week = await agentWeek({
  weekNumber: 1,
  weeksTotal: 4,
  questionnaireData: profile,
  trainingFrequency: 3,
  activities: ["gym"],
  fitnessGoal: "build-muscles",
  previousWeeks: [],
});

expect(week.days).toHaveLength(3);
```

**Benefits:**

- ⚡ Fast execution (no orchestrator overhead)
- 🎯 Test specific scenarios
- 🐛 Easy to debug
- ♻️ Reusable contexts

---

## 📝 Example Test Contexts

### Beginner Weight Loss:

```typescript
const profile = {
  currentState: {
    fitnessLevel: "beginner",
    weight: 90,
  },
  wish: {
    fitnessGoal: "lose-weight",
    targetWeight: 75,
  },
  accessibility: {
    trainingFrequency: 3,
    trainingDuration: 45,
    activities: ["running", "gym"],
  },
};
```

### Advanced Muscle Building:

```typescript
const profile = {
  currentState: {
    fitnessLevel: "advanced",
    weight: 85,
  },
  wish: {
    fitnessGoal: "build-muscles",
    targetWeight: 92,
  },
  accessibility: {
    trainingFrequency: 5,
    trainingDuration: 90,
    activities: ["gym", "hiit"],
  },
};
```

### Senior Keep-Fit:

```typescript
const profile = {
  currentState: {
    age: 68,
    fitnessLevel: "beginner",
    weight: 75,
  },
  wish: {
    fitnessGoal: "keep-fit",
  },
  accessibility: {
    trainingFrequency: 2,
    trainingDuration: 30,
    activities: ["gym"],
  },
};
```

### With Injuries:

```typescript
const profile = {
  currentState: {
    fitnessLevel: "intermediate",
  },
  wish: {
    fitnessGoal: "build-muscles",
  },
  accessibility: {
    trainingFrequency: 3,
    trainingDuration: 60,
    activities: ["gym"],
  },
  injuries: ["shoulder", "knee"],
  healthLimitations: "shoulder and knee injuries",
};
```

---

## ✅ Expected Results

### agentWeek should:

- Generate EXACTLY `trainingFrequency` days
- Have proper block order: warmup → main → cooldown
- Apply progressive overload (week 4 > week 1)
- Respect contraindicated exercises for injuries
- Match specified activities

### agentNutrition should:

- Calculate appropriate calorie deficit/surplus
- Use correct macro split by goal
- Create 3+ meal plan with snacks
- Add hydration (>2L, <5L)

### agentSleep should:

- Recommend 7-9 hours duration
- Set realistic times (bedtime 21:00-23:30, wake 05:30-07:30)
- Provide 3+ actionable recommendations
- Adjust for training days

### agentSteps should:

- Set goal-appropriate target (weight loss: 10k+, muscle: 7-9k)
- Adjust for activity level
- Provide helpful tips (3+)

### generateWorkoutProgram should:

- Stream plan updates
- Generate weeks sequentially (1 → 2 → 3 → 4)
- Generate components in parallel
- Update store incrementally
- Complete all steps

---

## 🏃 Quick Test Run

Run a single AI test by path (see README for test names):

```bash
npm run test:agents -- agents/workout-program/__tests__/week-simple.ai.test.ts
npm run test:agents -- agents/nutrition/__tests__/simple.ai.test.ts -t "generates"
```

---

## 🐛 Debugging

### Show full console output:

```bash
npm run test:agents -- --verbose
```

### Run single test:

```bash
npm run test:agents -- -t "should generate week 1 for beginner"
```

### Watch mode:

```bash
npm run test:agents:watch
```

---

## 📚 More Info

- **Strategy:** `TESTING_STRATEGY.md`
- **Test Profiles:** `/data/test-profiles.ts`
- **Coverage Goals:** See main README below

---

Last updated: 2026-02-04
