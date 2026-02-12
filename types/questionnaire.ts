export type Gender = "male" | "female" | "other";
export type FitnessGoal = "build-muscles" | "lose-weight" | "keep-fit";

/**
 * SSOT (Single Source of Truth) for activities with their display labels
 * All activity types and labels derived from this single config
 */
export const ACTIVITY_CONFIG = {
  "at-home": "At-Home Fitness",
  gym: "Gym",
  running: "Running",
  stretching: "Stretching",
  pilates: "Pilates",
  "wall-pilates": "Wall Pilates",
  hiit: "HIIT",
  posture: "Posture Workout",
  yoga: "Yoga",
  "fast-workout": "Fast Workout",
  dancing: "Dancing",
  cycling: "Cycling",
  swimming: "Swimming",
  somatic: "Somatic",
} as const;

export type ActivityType = keyof typeof ACTIVITY_CONFIG;
export const ACTIVITY_TYPES = Object.keys(ACTIVITY_CONFIG) as ActivityType[];

export type PlanType = "optimal" | "wished";
export type WeightUnit = "kg" | "lbs";
export type HeightUnit = "cm" | "ft";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type DailyActivityLevel =
  | "mostly-sitting"
  | "lightly-active"
  | "on-your-feet"
  | "physically-demanding";

export const INJURY_TYPE = {
  shoulder: "Shoulder",
  wrist: "Wrist",
  knee: "Knee",
  ankle: "Ankle",
  "lower-back": "Lower Back",
} as const;

export type InjuryType = keyof typeof INJURY_TYPE;

export const BODY_TYPE = {
  slim: "Slim",
  average: "Average",
  soft: "Soft",
  muscular: "Muscular",
} as const;

export type BodyType = keyof typeof BODY_TYPE;

export interface QuestionnaireState {
  // Current state
  gender?: Gender;
  birthday?: Date;
  height?: number;
  heightUnit?: HeightUnit;
  currentWeight?: number;
  // TODO: remove currentWeightUnit, as it is always 'kg' now, use user preference in units for UI representation instead
  currentWeightUnit?: WeightUnit;
  currentBodyType?: BodyType;

  // Goal
  fitnessGoal?: FitnessGoal;
  targetWeight?: number;
  targetWeightUnit?: WeightUnit;
  targetBodyType?: BodyType;

  // Accessibility
  trainingFrequency?: number; // days per week
  trainingDays?: number[]; // [1, 3, 5] = Mon, Wed, Fri (0=Sunday, 1=Monday, ..., 6=Saturday)
  trainingDuration?: number; // minutes per session
  activities?: ActivityType[];

  // Health & Limitations
  fitnessLevel?: FitnessLevel;
  dailyActivityLevel?: DailyActivityLevel;
  healthIssues?: string;
  injuries?: InjuryType[];
  allergies?: string;

  // Inspiration
  physiquePhotoUri?: string;

  // Selected plan
  selectedPlan?: PlanType;
}

export interface MealMacros {
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
}

export interface MealDistribution {
  calories: number;
  macros: MealMacros;
}

export interface CalculatedPlan {
  duration: number; // days
  frequency: string; // e.g., "4 × 1.5 h / week"
  activities: string[];
  calories: number; // kcal per day
  macros: {
    protein: number; // grams
    carbs: number; // grams
    fats: number; // grams
  };
  macroSplit: {
    protein: number; // percentage
    carbs: number; // percentage
    fats: number; // percentage
  };
  mealDistribution: {
    breakfast: MealDistribution;
    lunch: MealDistribution;
    dinner: MealDistribution;
    snacks: MealDistribution;
  };
  // Legacy fields from main (for backward compatibility with old tests)
  recommendedFoods?: {
    proteins: string[];
    carbs: string[];
    vegetables: string[];
    fats: string[];
  };
  foods?: string[]; // Backward compatibility
  samplePortions?: any; // Backward compatibility
}

export interface QuestionnaireContextType {
  state: QuestionnaireState;
  updateState: (updates: Partial<QuestionnaireState>) => void;
  resetState: () => void;
  generateJSON: () => string;
  calculatePlan: (planType: PlanType) => CalculatedPlan;
}

// ============= EXERCISE TYPES (11 types) =============

interface BaseExercise {
  id: string;
  title: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  notes?: string;
}

export interface StrengthSetExercise extends BaseExercise {
  type: "strength-set";
  sets: number;
  reps: string;
  weight_kg?: number;
  rest_sec: number;
  muscleGroups: string[];
  equipment?: string[];
  formCues?: string[];
  superset_group?: string;
  progression_notes?: string;
}

export interface CardioSteadyRunningExercise extends BaseExercise {
  type: "cardio-steady-running";
  target_distance_m?: number;
  duration_sec?: number;
  target_pace_sec_per_km?: number;
  location?: "outdoor" | "treadmill";
}

export interface CardioSteadyWalkingExercise extends BaseExercise {
  type: "cardio-steady-walking";
  target_distance_m?: number;
  duration_sec?: number;
  target_pace_sec_per_km?: number;
}

export interface CardioSteadyCyclingOutdoorExercise extends BaseExercise {
  type: "cardio-steady-cycling-outdoor";
  target_distance_m?: number;
  duration_sec?: number;
  target_speed_kmh?: number;
  terrain?: "flat" | "hilly";
}

export interface CardioSteadyCyclingIndoorExercise extends BaseExercise {
  type: "cardio-steady-cycling-indoor";
  duration_sec: number;
  target_speed_kmh?: number;
  resistance_level?: number;
}

export interface CardioSteadyEllipticalExercise extends BaseExercise {
  type: "cardio-steady-elliptical";
  duration_sec: number;
  resistance_level?: number;
  target_spm?: number;
}

export interface CardioSteadyRowingExercise extends BaseExercise {
  type: "cardio-steady-rowing";
  target_distance_m?: number;
  duration_sec?: number;
  target_pace_sec_per_500m?: number;
  stroke_rate?: number;
}

export interface CardioSteadyHikingExercise extends BaseExercise {
  type: "cardio-steady-hiking";
  target_distance_m?: number;
  duration_sec?: number;
  elevation_gain_m?: number;
}

export interface CardioIntervalExercise extends BaseExercise {
  type: "cardio-interval";
  work_sec: number;
  rest_sec: number;
  rounds: number;
}

export interface MindBodyPoseExercise extends BaseExercise {
  type: "mind-body-pose";
  duration_sec: number;
  media_url?: string;
  breathing?: "steady" | "deep" | "box";
}

export interface SwimLapPoolExercise extends BaseExercise {
  type: "swim-lap-pool";
  target_distance_m?: number;
  duration_sec?: number;
  pool_length_m: 25 | 50;
  stroke_type?: "freestyle" | "breaststroke" | "backstroke" | "butterfly";
}

export type Exercise =
  | StrengthSetExercise
  | CardioSteadyRunningExercise
  | CardioSteadyWalkingExercise
  | CardioSteadyCyclingOutdoorExercise
  | CardioSteadyCyclingIndoorExercise
  | CardioSteadyEllipticalExercise
  | CardioSteadyRowingExercise
  | CardioSteadyHikingExercise
  | CardioIntervalExercise
  | MindBodyPoseExercise
  | SwimLapPoolExercise;

export type ExerciseType = Exercise["type"];

// ============= BLOCK TYPE =============

export interface Block {
  id: string;
  type: "warmup" | "main" | "cooldown";
  title: string;
  exercises: Exercise[];
  notes?: string;
}

// ============= WORKOUT DAY & WEEK =============

export interface WorkoutDay {
  dayNumber: number;
  activityType: ActivityType;
  activityTypeDescriptive?: string; // e.g., "Strength Training - Upper Body (Upper A)"
  blocks: Block[];
  difficulty?: "easy" | "medium" | "hard";
  estimatedDuration?: number;
  notes?: string;
  scheduledDate?: string; // 'YYYY-MM-DD' format - assigned after generation
}

export interface WorkoutWeek {
  weekNumber: number;
  days: WorkoutDay[];
  focus?: string;
}

export interface ReasoningStep {
  step: number;
  description: string;
  timestamp: string;
}

export interface WorkoutProgram {
  weeks: WorkoutWeek[];
  reasoning?: ReasoningStep[]; // Optional, not used in current implementation
  summary?: string;
}
