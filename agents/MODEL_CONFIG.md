# AI Model Configuration Guide

## Current Models (Updated 2026-02-04)

All agents currently use **GPT-5-mini** (Feb 2026 release) for cost-effective, high-quality generation with enhanced reasoning.

### Model Usage by Agent:

| Agent          | File                                | Model      | Purpose                     |
| -------------- | ----------------------------------- | ---------- | --------------------------- |
| Orchestrator   | `workout-program/agent.ts`          | gpt-5-mini | Plan generation (streaming) |
| Week Agent     | `workout-program/week-agent.ts`     | gpt-5-mini | Weekly workout generation   |
| Nutrition      | `nutrition/agent.ts`                | gpt-5-mini | Meal planning with tools    |
| Sleep          | `sleep/agent.ts`                    | gpt-5-mini | Sleep schedule generation   |
| Steps          | `steps/agent.ts`                    | gpt-5-mini | Daily steps target          |
| Plan Generator | `fitness-program/plan-generator.ts` | gpt-5-mini | Execution plan              |

---

## How to Change Model

### Option 1: Update Individual Agent

```typescript
// In agent file (e.g., agents/nutrition/agent.ts):
const result = await generateObject({
  model: openai("MODEL_NAME_HERE"),
  // ... rest of config
});
```

### Option 2: Create Centralized Config

```typescript
// agents/openai-config.ts
export const AI_MODELS = {
  planning: "gpt-5-mini", // For orchestrator, plan generation
  weekGeneration: "gpt-5-mini", // For week-agent
  nutrition: "gpt-5-mini", // For nutrition agent
  sleep: "gpt-5-mini", // For sleep agent
  steps: "gpt-5-mini", // For steps agent
};

// Then import and use:
import { AI_MODELS } from "./openai-config";
model: openai(AI_MODELS.weekGeneration);
```

---

## Models to Test

### OpenAI Models:

- ✅ `gpt-5-mini` - **Current** (Feb 2026, best balance of cost/quality/speed)
- ⏸️ `gpt-4o` - Previous (good schema adherence, but 4x more expensive)
- ⏸️ `gpt-4o-mini` - Legacy (schema issues with week-agent)
- 🔄 `gpt-4.1-mini` - Same price as gpt-5-mini, may be worth testing
- 🔄 `o1` - Reasoning model (slower, more expensive)
- 🔄 `o1-mini` - Smaller reasoning model

### Anthropic Models (via @anthropic-ai/sdk):

- 🔄 `claude-3-5-sonnet-20241022` - Latest Claude
- 🔄 `claude-3-5-haiku-20241022` - Fast, cheap
- 🔄 `claude-3-opus-20240229` - Most capable

### Google Models (via @google/generative-ai):

- 🔄 `gemini-2.0-flash-exp` - Experimental fast model
- 🔄 `gemini-1.5-pro` - Multimodal, long context
- 🔄 `gemini-1.5-flash` - Fast, cheaper

### Local/Open Source (via Ollama):

- 🔄 `llama3.3:70b` - Meta's latest
- 🔄 `qwen2.5:72b` - Alibaba's model
- 🔄 `deepseek-r1:70b` - Reasoning model

---

## Testing Checklist

When testing a new model:

1. ✅ Update model in target agent file
2. ✅ Run simple AI test: `npm run test:agents -- simple.ai.test.ts`
3. ✅ Check schema validation (no `AI_NoObjectGeneratedError`)
4. ✅ Verify output quality
5. ✅ Measure generation time
6. ✅ Calculate cost (tokens used)

### Test Commands:

```bash
# Test specific agent
npm run test:agents -- agents/nutrition/__tests__/simple.ai.test.ts --no-coverage

# Test all simple AI tests
npm run test:agents -- --testPathPattern="simple\.ai\.test\.ts$" --no-coverage

# Test week agent (most complex)
npm run test:agents -- agents/workout-program/__tests__/week-simple.ai.test.ts --no-coverage
```

---

## Performance Baseline (GPT-5-mini)

| Agent     | Time (est) | Tokens (approx) | Cost (approx) | vs GPT-4o      |
| --------- | ---------- | --------------- | ------------- | -------------- |
| Nutrition | ~10s       | ~2k-3k          | $0.003        | 5x cheaper     |
| Sleep     | ~15s       | ~3k-4k          | $0.004        | 5x cheaper     |
| Steps     | ~12s       | ~2k-3k          | $0.003        | 5x cheaper     |
| Week      | ~25s       | ~10k-15k        | $0.020        | 5x cheaper     |
| **Total** | **~62s**   | **~20k**        | **~$0.03**    | **5x cheaper** |

---

## Notes

- GPT-5-mini provides excellent schema adherence with 1M context window
- If GPT-5-mini has issues, GPT-4.1-mini is same price with similar capabilities
- Week Agent is the most complex and requires strong schema adherence
- Test schema validation first before testing output quality
- Some models may need prompt adjustments

---

Last updated: 2026-02-04
