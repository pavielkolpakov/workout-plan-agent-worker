/**
 * Run logger for fitness program generation.
 * Collects which agents were called and their token usage for a single generation run.
 * Use for server logs and for preparing data for Langfuse.
 */

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AgentRunEntry {
  agent: string;
  order: number;
  usage: TokenUsage;
}

export interface RunSummary {
  agents: AgentRunEntry[];
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  durationMs?: number;
  estimatedCost?: {
    inputCost: number; // USD
    outputCost: number; // USD
    totalCost: number; // USD
  };
}

/**
 * Normalize usage from AI SDK (LanguageModelUsage) to our shape.
 * SDK may use promptTokens/completionTokens or other names.
 */
function normalizeUsage(usage: unknown): TokenUsage {
  if (!usage || typeof usage !== "object") return {};
  const u = usage as Record<string, unknown>;

  // Debug log to see what we're getting from AI SDK
  if (process.env.DEBUG_TOKENS) {
    console.log("[RunLogger] Raw usage from AI SDK:", usage);
  }

  const prompt = [u.promptTokens, (u as any).inputTokens].find(
    (n) => typeof n === "number"
  ) as number | undefined;
  const completion = [u.completionTokens, (u as any).outputTokens].find(
    (n) => typeof n === "number"
  ) as number | undefined;
  const total =
    typeof (u as any).totalTokens === "number"
      ? (u as any).totalTokens
      : prompt !== undefined && completion !== undefined
        ? prompt + completion
        : undefined;

  const result = {
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: total,
  };

  // Always log normalized result to help debug
  if (prompt || completion || total) {
    console.log(
      `[RunLogger] Normalized usage: in=${prompt} out=${completion} total=${total}`
    );
  }

  return result;
}

export class RunLogger {
  private order = 0;
  private entries: AgentRunEntry[] = [];
  private startTime = Date.now();

  /**
   * Record that an agent was called and (optionally) its token usage.
   */
  logAgent(agentName: string, rawUsage?: unknown): void {
    this.order += 1;
    const usage = normalizeUsage(rawUsage);
    this.entries.push({
      agent: agentName,
      order: this.order,
      usage,
    });
  }

  getSummary(): RunSummary {
    let totalPrompt = 0;
    let totalCompletion = 0;
    for (const e of this.entries) {
      totalPrompt += e.usage.promptTokens ?? 0;
      totalCompletion += e.usage.completionTokens ?? 0;
    }
    const totalTokens = totalPrompt + totalCompletion;

    // Calculate estimated cost for gpt-5-mini
    // $0.25 per 1M input tokens, $2 per 1M output tokens
    const inputCost = (totalPrompt / 1_000_000) * 0.25;
    const outputCost = (totalCompletion / 1_000_000) * 2.0;
    const totalCost = inputCost + outputCost;

    return {
      agents: [...this.entries],
      totalPromptTokens: totalPrompt,
      totalCompletionTokens: totalCompletion,
      totalTokens,
      durationMs: Date.now() - this.startTime,
      estimatedCost: {
        inputCost,
        outputCost,
        totalCost,
      },
    };
  }

  /**
   * Log a single line per agent and a final totals line (for server console).
   */
  printSummary(): void {
    const summary = this.getSummary();
    const lines: string[] = [
      "[RunLogger] --- Fitness generation run ---",
      ...summary.agents.map(
        (e) =>
          `[RunLogger]   ${e.order}. ${e.agent}: ` +
            [
              e.usage.promptTokens != null && `in=${e.usage.promptTokens}`,
              e.usage.completionTokens != null &&
                `out=${e.usage.completionTokens}`,
              e.usage.totalTokens != null && `total=${e.usage.totalTokens}`,
            ]
              .filter(Boolean)
              .join(", ") || "(no usage)"
      ),
      `[RunLogger]   TOTAL: prompt=${summary.totalPromptTokens} completion=${summary.totalCompletionTokens} total=${summary.totalTokens}`,
    ];
    if (summary.estimatedCost) {
      lines.push(
        `[RunLogger]   COST: $${summary.estimatedCost.totalCost.toFixed(4)} (in=$${summary.estimatedCost.inputCost.toFixed(4)} out=$${summary.estimatedCost.outputCost.toFixed(4)})`
      );
    }
    if (summary.durationMs != null) {
      lines.push(
        `[RunLogger]   duration=${(summary.durationMs / 1000).toFixed(1)}s`
      );
    }
    lines.push("[RunLogger] ------------------------------------");
    console.log(lines.join("\n"));
  }

  /**
   * Serializable summary for SSE complete event (and later Langfuse).
   */
  toSerializable(): RunSummary {
    return this.getSummary();
  }
}
