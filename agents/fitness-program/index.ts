/**
 * Fitness Program Shared Types and Utilities
 *
 * Note: The main generation logic has moved to the workout-program agent,
 * which now uses tools for nutrition, sleep, and steps generation.
 *
 * This module only exports shared types and the plan generator (used for planning UI).
 */

export * from "./plan-generator";
export { CompleteFitnessProgramSchema } from "./schemas";
export * from "./types";
