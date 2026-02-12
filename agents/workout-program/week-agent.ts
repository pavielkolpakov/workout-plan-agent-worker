/**
 * Week Agent - Full-context AI agent for generating a single workout week
 *
 * Orchestrator-Worker pattern:
 * - Main generator (orchestrator) coordinates multiple week agents (workers)
 * - Each week agent has full context: user profile, previous weeks, progression
 * - Agent generates complete week structure inline (not via tools)
 */

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { WorkoutWeek } from "./schemas";
import { SingleWeekSchema } from "./schemas";

export interface WeekAgentResult {
  week: WorkoutWeek;
  usage?: unknown; // AI SDK usage object (will be normalized by RunLogger)
}

export interface WeekAgentContext {
  // Week info
  weekNumber: number;
  weeksTotal: number;

  // User profile (full questionnaire data)
  questionnaireData: {
    currentState?: {
      gender?: string;
      age?: number | null;
      birthday?: string;
      weight?: number;
      height?: number;
      fitnessLevel?: string; // "beginner" | "intermediate" | "advanced"
      dailyActivityLevel?: string;
      currentBodyType?: string;
    };
    wish?: {
      fitnessGoal?: string; // "lose-weight" | "build-muscles" | "keep-fit"
      targetWeight?: number;
      targetBodyType?: string;
    };
    accessibility?: {
      trainingFrequency?: number;
      trainingDays?: number[];
      trainingDuration?: number;
      activities?: string[];
    };
    healthLimitations?: string | null;
    injuries?: string[] | string | null;
    [key: string]: any;
  };

  // Training parameters
  trainingFrequency: number; // Days per week (e.g., 3)
  trainingDuration: number; // Minutes per session
  activities: string[]; // ["gym", "running"]
  fitnessGoal: string;
  healthLimitations?: string | null;

  // Progression context
  previousWeeks?: WorkoutWeek[]; // For progressive overload
}

/**
 * Generate system prompt with full context
 */
function generateWeekSystemPrompt(context: WeekAgentContext): string {
  const {
    weekNumber,
    weeksTotal,
    questionnaireData,
    trainingFrequency,
    trainingDuration,
    activities,
    fitnessGoal,
    healthLimitations,
    previousWeeks = [],
  } = context;

  const age = questionnaireData.currentState?.age || 25;
  const gender = questionnaireData.currentState?.gender || "not specified";
  const fitnessLevel =
    questionnaireData.currentState?.fitnessLevel || "intermediate";
  const weight = questionnaireData.currentState?.weight || "not specified";

  const progression =
    previousWeeks.length > 0
      ? `\n\nPREVIOUS WEEKS PROGRESSION:\n${previousWeeks
          .map((w) => `Week ${w.weekNumber}: ${w.focus || "Training week"}`)
          .join(
            "\n"
          )}\n\nYou MUST progress from these previous weeks with increased intensity/volume.`
      : "\n\nThis is the FIRST week - focus on establishing proper form and baseline.";

  return `You are an expert fitness trainer creating Week ${weekNumber} of ${weeksTotal} for a personalized workout program.

USER PROFILE:
- Gender: ${gender}
- Age: ${age} years
- Weight: ${weight}kg
- Fitness Level: ${fitnessLevel}
- Daily Activity: ${questionnaireData.currentState?.dailyActivityLevel || "moderate"}
- Goal: ${fitnessGoal}
- Health Limitations: ${healthLimitations || "none"}

TRAINING PARAMETERS:
- Frequency: ${trainingFrequency} days per week (MANDATORY)
- Duration: ${trainingDuration} minutes per session
- Activities: ${activities.join(", ")}
${progression}

SCIENTIFIC TRAINING GUIDELINES:

1. VOLUME STANDARDS (Sets per Muscle per Week):
   - Beginner: 10-15 sets | Intermediate: 15-20 sets | Advanced: 20-25+ sets
   - Example (Intermediate Upper/Lower): Chest 6-8 sets, Back 6-8 sets, Shoulders 4-6 sets, Arms 4-6 sets each
   - Example (Intermediate Lower): Quads 8-12 sets, Hamstrings 6-8 sets, Glutes 6-8 sets

2. REP RANGES BY GOAL:
   - Strength (1-5 reps): 85-100% 1RM, rest 3-5 min
   - Strength + Size (6-8 reps): 80-85% 1RM, rest 2-3 min
   - Hypertrophy/Build Muscles (8-12 reps): 70-80% 1RM, rest 90-120s compounds, 60-90s isolation
   - Endurance/Fat Loss (12-15 reps): 60-70% 1RM, rest 45-90s

3. REST PERIODS BY FITNESS LEVEL & EXERCISE:
   - Beginner: Compounds 120-180s, Isolation 90-120s, Core 60-90s
   - Intermediate: Compounds 90-120s, Isolation 60-90s, Core 45-60s
   - Advanced: Compounds 60-90s, Isolation 45-60s, Core 30-45s

4. EXERCISE ORDER (MANDATORY):
   a) Warmup (5-10 min): Dynamic stretches, light cardio, mobility
   b) Primary Compounds: Squat, deadlift, bench press, overhead press (when fresh!)
   c) Secondary Compounds: Row, lunges, pull-ups (still demanding)
   d) Isolation: Curls, extensions, raises, flyes (when fatigued OK)
   e) Core: Planks, ab work
   f) Cooldown (5 min): Static stretching, foam rolling

5. PROGRESSIVE OVERLOAD (Week-to-Week):
   - Week 1: Establish baseline (e.g., 60kg × 3 sets × 10 reps)
   - Week 2: Increase reps (e.g., 60kg × 3 sets × 12 reps)
   - Week 3: Increase sets (e.g., 60kg × 4 sets × 10 reps)
   - Week 4: Increase weight (e.g., 63kg × 4 sets × 10 reps, +5%)
   - Rate: Beginner 2-5%/week, Intermediate 1-3%/week, Advanced 0.5-2%/week

6. INJURY PREVENTION - CONTRAINDICATED EXERCISES:
   - Shoulder injuries: NO overhead press, behind-neck exercises, upright rows, heavy lateral raises >90°
     → USE: Chest press, cable exercises, neutral grip movements, front raises <90°
   - Knee injuries: NO deep squats below parallel, running/jumping, lunges, leg extensions >90°
     → USE: Partial squats (quarter/half depth), leg press, cycling, swimming
   - Lower back injuries: NO heavy deadlifts/squats, bent-over rows, good mornings
     → USE: Machine exercises, cable exercises, glute bridges, planks (if tolerated)

7. COMPOUND VS ISOLATION RATIO:
   - Optimal: 2:1 compound to isolation exercises
   - Compounds build multiple muscles efficiently, prioritize them
   - Isolation fine-tunes development, use as accessory work

⚠️ CRITICAL - ALLOWED EXERCISE TYPES (ONLY THESE):
1. **strength-set** - for ALL strength exercises (bench press, squats, curls, etc.)
   Required fields: sets, reps, rest_sec, muscleGroups
2. **cardio-steady-running** - for steady running (duration_sec OR target_distance_m + target_pace_sec_per_km)
3. **cardio-steady-walking, cardio-steady-cycling-outdoor, cardio-steady-cycling-indoor**
4. **cardio-steady-elliptical, cardio-steady-rowing, cardio-steady-hiking**
5. **cardio-interval** - for HIIT (sprints, battle ropes, etc.) - Required: work_sec, rounds, rest_sec
6. **mind-body-pose** - for stretching, yoga poses, mobility work - Required: duration_sec
7. **swim-lap-pool** - for swimming
❌ NEVER use: "range-of-motion", "mobility", "core" - these are NOT valid types!

⚠️ CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${trainingFrequency} complete workout days in the "days" array
2. Each day MUST have: dayNumber (1-7), activityType, difficulty, blocks with exercises

3. **BLOCK vs EXERCISE TYPES (DO NOT CONFUSE!):**
   - Block "type" is ALWAYS one of: "warmup", "main", "cooldown" (ONLY THESE 3!)
   - Exercise "type" is different and goes INSIDE the block's exercises array
   
   **Examples of CORRECT block structure:**
   
   ✅ Strength training day:
   {
     "blocks": [
       {"id": "w1d1_warmup", "type": "warmup", "exercises": [{"type": "mind-body-pose", ...}]},
       {"id": "w1d1_main", "type": "main", "exercises": [{"type": "strength-set", ...}]},
       {"id": "w1d1_cooldown", "type": "cooldown", "exercises": [{"type": "mind-body-pose", ...}]}
     ]
   }
   
   ✅ Running/cardio day:
   {
     "blocks": [
       {"id": "w1d5_warmup", "type": "warmup", "exercises": [{"type": "mind-body-pose", ...}]},
       {"id": "w1d5_main", "type": "main", "exercises": [{"type": "cardio-steady-running", ...}]},
       {"id": "w1d5_cooldown", "type": "cooldown", "exercises": [{"type": "mind-body-pose", ...}]}
     ]
   }
   
   ❌ WRONG - cardio type in block instead of "main":
   {"id": "w1d5_main", "type": "cardio-steady-running", ...} // NEVER DO THIS!

4. **Warmup block:** type="warmup", ALL exercises use type="mind-body-pose" with duration_sec
5. **Main block:** type="main", exercises use type="strength-set" (for gym) OR cardio types (for cardio activities)
6. **Cooldown block:** type="cooldown", ALL exercises use type="mind-body-pose" with duration_sec
7. Use progressive overload: increase intensity/volume from previous weeks
8. Match activities to user preferences: ${activities.join(", ")}
9. Adapt to fitness level: ${fitnessLevel}
10. DOUBLE CHECK: Block type is ONLY warmup/main/cooldown, exercise types are inside exercises array!

WEEK STRUCTURE:
{
  "weekNumber": ${weekNumber},
  "focus": "Inspiring weekly theme/focus",
  "progressionNotes": "How this week progresses from previous weeks",
  "days": [
    // EXACTLY ${trainingFrequency} day objects
    {
      "dayNumber": 1,
      "activityType": "Gym - Upper Body",
      "difficulty": "medium",
      "blocks": [
        {"id": "w1d1_warmup", "type": "warmup", "title": "...", "exercises": [...]},
        {"id": "w1d1_main", "type": "main", "title": "...", "exercises": [...]},
        {"id": "w1d1_cooldown", "type": "cooldown", "title": "...", "exercises": [...]}
      ]
    },
    {
      "dayNumber": 3,
      "activityType": "Running - Steady",
      "difficulty": "easy",
      "blocks": [
        {"id": "w1d3_warmup", "type": "warmup", "title": "...", "exercises": [...]},
        {"id": "w1d3_main", "type": "main", "title": "...", "exercises": [...]},
        {"id": "w1d3_cooldown", "type": "cooldown", "title": "...", "exercises": [...]}
      ]
    }
  ]
}

Generate a complete, balanced week that progresses the user toward their fitness goal.`;
}

/**
 * Week Agent - Generate a single workout week with full context
 */
export async function agentWeek(
  context: WeekAgentContext
): Promise<WeekAgentResult> {
  console.log(
    `[Week Agent] 🏋️ Generating Week ${context.weekNumber}/${context.weeksTotal} with ${context.trainingFrequency} days`
  );

  const systemPrompt = generateWeekSystemPrompt(context);

  try {
    console.log("[Week Agent] 📝 System prompt length:", systemPrompt.length);
    console.log("[Week Agent] 🔧 Using model: gpt-5-mini");

    const result = await generateObject({
      model: openai("gpt-5-mini"),
      schema: SingleWeekSchema,
      system: systemPrompt,
      prompt: `Generate Week ${context.weekNumber} with EXACTLY ${context.trainingFrequency} complete workout days.
      
Activities: ${context.activities.join(", ")}
Goal: ${context.fitnessGoal}
Duration: ${context.trainingDuration} minutes per session

Remember: The "days" array MUST contain ${context.trainingFrequency} complete day objects!`,
      experimental_telemetry: {
        isEnabled: true,
        functionId: `workout-week-${context.weekNumber}`,
        metadata: {
          weekNumber: context.weekNumber,
          weeksTotal: context.weeksTotal,
        },
      },
    });

    const week = result.object;
    const usage = result.usage;

    console.log(`[Week Agent] 📊 Raw result:`, {
      hasObject: !!result.object,
      objectKeys: Object.keys(result.object || {}),
      finishReason: result.finishReason,
      usage: result.usage,
    });

    console.log(`[Week Agent] ✅ Week ${context.weekNumber} generated:`, {
      daysCount: week.days?.length,
      dayNumbers: week.days?.map((d) => d.dayNumber),
      activities: week.days?.map((d) => d.activityType),
      focus: week.focus,
    });

    console.log(`[Week Agent] 📊 Usage:`, usage);

    // Log full week for debugging
    if (week.days?.length !== context.trainingFrequency) {
      console.warn(
        `[Week Agent] ⚠️ Expected ${context.trainingFrequency} days, got ${week.days?.length}`
      );
      console.log(
        "[Week Agent] Full week structure:",
        JSON.stringify(week, null, 2)
      );
    }

    return { week, usage };
  } catch (error) {
    console.error(
      `[Week Agent] 💥 Error generating Week ${context.weekNumber}:`,
      error
    );

    // Log detailed error info
    if (error && typeof error === "object") {
      console.error("[Week Agent] Error details:", {
        name: (error as any).name,
        message: (error as any).message,
        cause: (error as any).cause,
        text: (error as any).text?.substring(0, 500),
      });
    }

    throw error;
  }
}
