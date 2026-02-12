# AI Agents

Agents that generate the fitness program (workout, nutrition, sleep, steps).

**Updated:** 2026-02-04 · **Model:** gpt-5-mini (all agents)

---

## Structure

```
agents/
├── workout-program/    # Orchestrator + Week Agent
│   ├── agent.ts        # generateWorkoutProgram (plan + execution)
│   ├── week-agent.ts   # agentWeek — one week of training
│   ├── schemas.ts      # Zod schemas (11 exercise types)
│   ├── validation.ts
│   └── index.ts
├── nutrition/          # agentNutrition (AI + tools)
├── sleep/              # agentSleep
├── steps/              # agentSteps
├── run-logger.ts       # Token usage and cost logging
├── MODEL_CONFIG.md     # Model config
└── __tests__/          # See __tests__/README.md
```

---

## Architecture

**TypeScript-controlled orchestrator:**

1. **Plan** — AI generates steps (workout → then nutrition/sleep/steps in parallel).
2. **Execution** — TypeScript calls agents: weeks sequentially (`agentWeek` × N), then nutrition/sleep/steps in parallel.
3. **No AI tools for execution** — direct calls only: `agentWeek()`, `agentNutrition()`, etc.

| Component    | File                          | Model      | Purpose                 |
| ------------ | ----------------------------- | ---------- | ----------------------- |
| Orchestrator | workout-program/agent.ts      | gpt-5-mini | Plan + run agents       |
| Week Agent   | workout-program/week-agent.ts | gpt-5-mini | One week of workouts    |
| Nutrition    | nutrition/agent.ts            | gpt-5-mini | Calories, macros, meals |
| Sleep        | sleep/agent.ts                | gpt-5-mini | Sleep schedule          |
| Steps        | steps/agent.ts                | gpt-5-mini | Steps target            |

---

## Testing

- **Unit/calculated:** 103 tests.
- **AI (simple):** 4 tests — `simple.ai.test.ts` in nutrition/sleep/steps, `week-simple.ai.test.ts` in workout-program.

```bash
npm run test:agents
npm run test:agents -- --testPathPattern="\.ai\.test\.ts$"   # AI only
```

See [**tests**/README.md](./__tests__/README.md). Full reference: [docs/AGENTS.md](../docs/AGENTS.md).
