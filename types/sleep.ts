/**
 * Sleep Widget Data Types
 *
 * Types for managing planned sleep schedules and actual sleep data
 * from Health App integration (Apple Health / Google Fit)
 */

export interface PlannedSleep {
  /** Planned bedtime (e.g., 22:30) */
  bedtime: Date;
  /** Planned wake time (e.g., 06:30) */
  wakeTime: Date;
  /** Planned duration in minutes (e.g., 480 for 8h) */
  duration: number;
}

export interface ActualSleep {
  /** Actual bedtime from Health App */
  bedtime: Date;
  /** Actual wake time from Health App */
  wakeTime: Date;
  /** Actual duration in minutes */
  duration: number;
  /** Date of sleep (yesterday's night) */
  date: Date;
}

export interface SleepDeviation {
  /** Deviation in minutes. Positive = slept more, Negative = slept less */
  minutes: number;
  /** Color coding for deviation display */
  color: "blue" | "gray" | "red";
  /** Human-readable message (e.g., "You slept 55 minutes less than planned") */
  message: string;
}
