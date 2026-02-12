import { eq, sql } from "drizzle-orm";
import type { GenerationResult } from "../agents/workout-program/types";
import { db } from "../db/client";
import { agentJobs } from "../db/schema";

const POLL_INTERVAL_MS = 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function claimJob() {
  const rows = await db.execute(sql`
    UPDATE public.agent_jobs
    SET status = 'processing',
        started_at = now(),
        updated_at = now()
    WHERE id = (
      SELECT id FROM public.agent_jobs
      WHERE status = 'pending'
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);
  return rows.length > 0 ? (rows[0] as typeof agentJobs.$inferSelect) : null;
}

async function completeJob(jobId: string, result: GenerationResult) {
  await db
    .update(agentJobs)
    .set({
      status: "completed",
      result: result as unknown as Record<string, unknown>,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agentJobs.id, jobId));
}

async function failJob(jobId: string, error: string) {
  await db
    .update(agentJobs)
    .set({
      status: "failed",
      error,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agentJobs.id, jobId));
}

async function processJob(job: typeof agentJobs.$inferSelect) {
  console.log(`[Worker] Processing job ${job.id} (type=${job.type})`);

  if (job.type !== "fitness-program") {
    await failJob(job.id, `Unknown job type: ${job.type}`);
    console.log(`[Worker] Unknown job type "${job.type}", marked as failed`);
    return;
  }

  try {
    const { generateWorkoutProgram } =
      await import("../agents/workout-program/agent");

    const result: GenerationResult = await generateWorkoutProgram({
      questionnaireData: job.payload as any,
    });

    await completeJob(job.id, result);
    console.log(
      `[Worker] Job ${job.id} completed in ${result.metadata?.totalGenerationTime}ms`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failJob(job.id, message);
    console.error(`[Worker] Job ${job.id} failed:`, message);
  }
}

async function main() {
  console.log("[Worker] Starting agent job worker");
  console.log(`[Worker] Poll interval: ${POLL_INTERVAL_MS}ms`);

  while (true) {
    try {
      const job = await claimJob();

      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      await processJob(job);
    } catch (err) {
      console.error("[Worker] Poll loop error:", err);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

main();
