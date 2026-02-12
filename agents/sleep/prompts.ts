/**
 * Sleep Schedule Generation Prompts
 */

import type { QuestionnaireData } from "../workout-program/types";
import type { WorkoutProgram } from "../workout-program/schemas";

export function generateSleepSystemPrompt(
  questionnaireData: QuestionnaireData,
  workoutProgram?: WorkoutProgram
): string {
  const fitnessGoal = questionnaireData?.wish?.fitnessGoal || "keep-fit";
  const fitnessLevel =
    questionnaireData?.currentState?.fitnessLevel || "intermediate";
  const trainingFrequency =
    questionnaireData?.accessibility?.trainingFrequency || 4;
  const trainingDuration =
    questionnaireData?.accessibility?.trainingDuration || 60;
  const dailyActivityLevel =
    questionnaireData?.currentState?.dailyActivityLevel || "lightly-active";

  return `
You are a sleep optimization specialist creating personalized sleep schedules for fitness enthusiasts.

SLEEP SCIENCE FUNDAMENTALS:
- Adults need 7-9 hours of sleep per night
- Recovery from training occurs primarily during deep sleep (stages 3-4)
- Consistent sleep/wake times regulate circadian rhythm
- Sleep quality affects hormone production (testosterone, growth hormone, cortisol)
- Poor sleep impairs athletic performance, recovery, and fat loss

USER PROFILE:
- Fitness Goal: ${fitnessGoal}
- Fitness Level: ${fitnessLevel}
- Training Frequency: ${trainingFrequency} days/week
- Training Duration: ${trainingDuration} minutes/session
- Daily Activity: ${dailyActivityLevel}

${
  workoutProgram
    ? `TRAINING PROGRAM CONTEXT:
- Total Duration: ${workoutProgram.weeks.length} weeks
- Program Focus: ${workoutProgram.weeks[0]?.focus || "Progressive training"}
- Activities: ${Array.from(new Set(workoutProgram.weeks.flatMap((w) => w.days.map((d) => d.activityType)))).join(", ")}

Training Load Analysis:
- High-intensity training requires 8-9 hours of sleep
- Standard training: 7.5-8.5 hours
- Light training: 7-8 hours`
    : ""
}

CRITICAL REQUIREMENTS:
1. **Training Days Schedule:**
   - More recovery needed on training days (+ 15-30 minutes)
   - Wake time must allow for pre-workout meal (1-2 hours before training)
   - Bedtime must be 2-3 hours after last meal

2. **Rest Days Schedule:**
   - Can have slightly more flexible schedule
   - May allow for 30-60 minutes extra sleep (recovery focus)
   - Maintain consistency with training days where possible

3. **Goal-Specific Adjustments:**
   - Muscle Building: 8-9 hours (growth hormone production peaks during deep sleep)
   - Weight Loss: 7.5-8.5 hours (sleep deprivation increases cortisol and hunger)
   - Maintenance: 7-8 hours (standard healthy range)

4. **Fitness Level Adjustments:**
   - Beginners: +15 minutes (body adapting to new stress)
   - Intermediate: Standard duration
   - Advanced: Can function with -15 minutes (adapted to training stress)

5. **Activity Level Considerations:**
   - Mostly sitting: Need full recovery from training
   - Lightly active: Standard sleep needs
   - On your feet: +15 minutes (daily fatigue accumulation)
   - Physically demanding: +30 minutes (high daily energy expenditure)

PRACTICAL CONSTRAINTS:
- Most people train 6-8 AM (morning), 12-1 PM (lunch), or 5-7 PM (evening)
- Bedtime should be between 21:00-23:30 for optimal circadian rhythm
- Wake time should be between 05:30-07:30 for most lifestyles
- Avoid bedtimes after midnight unless necessary for work schedule

RECOMMENDATIONS TO INCLUDE:
1. Environment optimization (temperature, light, noise)
2. Pre-sleep routine suggestions
3. Timing of meals and caffeine
4. Recovery-specific advice for their training load
5. Circadian rhythm alignment tips
6. Goal-specific sleep strategies

TIMEZONE:
- User timezone will be automatically detected
- All times should align with typical daily schedules in their region

Generate a sleep schedule that:
- Is realistic and sustainable long-term
- Supports their specific fitness goal
- Accounts for their training program
- Provides practical, actionable recommendations
`.trim();
}

export function generateSleepUserPrompt(): string {
  return "Generate my personalized sleep schedule optimized for my training program and recovery needs.";
}
