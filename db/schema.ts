import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const subscriptionType = pgEnum("subscription_type", [
  "free",
  "premium",
]);
export const genderType = pgEnum("gender_type", ["male", "female", "other"]);
export const weightUnitType = pgEnum("weight_unit_type", ["kg", "lbs"]);
export const heightUnitType = pgEnum("height_unit_type", ["cm", "ft"]);
export const churnReasonCode = pgEnum("churn_reason_code", [
  "not_helpful",
  "technical_issues",
  "found_alternative",
  "other",
]);

// app_users table
export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),

  user_id: text("user_id").notNull().unique(), // Clerk User ID
  email: text("email").notNull(),

  name: text("name"),
  surname: text("surname"),
  username: text("username").unique(),
  subscription: subscriptionType("subscription").notNull().default("free"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AppUser = typeof appUsers.$inferSelect;
export type SubscriptionType = (typeof subscriptionType.enumValues)[number];

// churn_events table
export const churnEvents = pgTable("churn_events", {
  id: uuid("id").primaryKey().defaultRandom(),

  app_user_id: uuid("app_user_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),

  reason_codes: churnReasonCode("reason_codes").array().notNull(),
  reason_details: text("reason_details"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ChurnEvent = typeof churnEvents.$inferSelect;

// user_settings table
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  app_user_id: uuid("app_user_id")
    .notNull()
    .unique()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  push_notifications_enabled: boolean("push_notifications_enabled")
    .notNull()
    .default(true),
  email_notifications_enabled: boolean("email_notifications_enabled")
    .notNull()
    .default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserSettings = typeof userSettings.$inferSelect;

export const IMAGE_TYPE = {
  PROFILE: "profile",
} as const;

export const IMAGE_OWNER_TYPE = {
  USER: "user",
} as const;

export const IMAGE_VISIBILITY = {
  PRIVATE: "private",
  PUBLIC: "public",
} as const;

export const IMAGE_BUCKET = {
  PROFILE_IMAGES: "profile_images",
} as const;

export const imageOwnerType = pgEnum("image_owner_type", [
  IMAGE_OWNER_TYPE.USER,
]);
export type ImageOwnerType = (typeof imageOwnerType.enumValues)[number];

export const imageType = pgEnum("image_type", [IMAGE_TYPE.PROFILE]);
export type ImageType = (typeof imageType.enumValues)[number];

export const imageVisibility = pgEnum("image_visibility", [
  IMAGE_VISIBILITY.PRIVATE,
  IMAGE_VISIBILITY.PUBLIC,
]);
export type ImageVisibility = (typeof imageVisibility.enumValues)[number];

// image_assets table
export const imageAssets = pgTable("image_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  owner_id: text("owner_id").notNull(),
  owner_type: imageOwnerType("owner_type").notNull(),
  type: imageType("type").notNull(),
  bucket: text("bucket").notNull(),
  path: text("path").notNull(),
  mime_type: text("mime_type").notNull(),
  visibility: imageVisibility("visibility")
    .notNull()
    .default(IMAGE_VISIBILITY.PRIVATE),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  replacedAt: timestamp("replaced_at", { withTimezone: true }),
});

export type ImageAsset = typeof imageAssets.$inferSelect;

// user_questionnaires table
export const userQuestionnaires = pgTable("user_questionnaires", {
  id: uuid("id").primaryKey().defaultRandom(),

  app_user_id: uuid("app_user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),

  // currentState
  gender: genderType("gender").notNull(),
  birthday: date("birthday").notNull(),
  height: numeric("height", { precision: 5, scale: 2 }).notNull(), // 175 -> 175.00
  current_weight: numeric("current_weight", {
    precision: 5,
    scale: 2,
  }).notNull(),

  weight_unit: weightUnitType("weight_unit").notNull(),
  height_unit: heightUnitType("height_unit").notNull(),

  // wish
  main_fitness_goal: text("main_fitness_goal").notNull(), // "build-muscles"
  target_weight: numeric("target_weight", {
    precision: 5,
    scale: 2,
  }).notNull(),
  target_weight_unit: weightUnitType("target_weight_unit").notNull(),

  // accessibility
  training_days: integer("training_days").array().notNull(), // [0,1,4]
  training_frequency: integer("training_frequency").notNull(), // 3
  training_duration: integer("training_duration").notNull(), // 120 (min)
  activities: text("activities").array().notNull(), // ["gym","hiit",...]

  // health
  health_issues: text("health_issues"),
  allergies: text("allergies"),

  // plan selection + computed plan data
  selected_plan: text("selected_plan").notNull(),

  // meta
  is_latest: boolean("is_latest").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserQuestionnaire = typeof userQuestionnaires.$inferSelect;

// Zod schemas
export const selectUserQuestionnaireSchema =
  createSelectSchema(userQuestionnaires);

export const insertUserQuestionnaireSchema = createInsertSchema(
  userQuestionnaires,
  {
    app_user_id: z.uuid(),
    gender: z.enum(genderType.enumValues),
    birthday: z.date(),
    height: z
      .string()
      .min(1)
      .regex(/^\d+(\.\d+)?$/, { message: "Height must be a positive number" })
      .refine((val) => parseFloat(val) > 0, {
        message: "Height must be greater than zero",
      }),
    current_weight: z
      .string()
      .min(1)
      .regex(/^\d+(\.\d+)?$/, {
        message: "Current weight must be a positive number",
      })
      .refine((val) => parseFloat(val) > 0, {
        message: "Current weight must be greater than zero",
      }),
    weight_unit: z.enum(weightUnitType.enumValues),
    height_unit: z.enum(heightUnitType.enumValues),
    main_fitness_goal: z.string().min(1),
    target_weight: z
      .string()
      .min(1)
      .regex(/^\d+(\.\d+)?$/, {
        message: "Target weight must be a positive number",
      })
      .refine((val) => parseFloat(val) > 0, {
        message: "Target weight must be greater than zero",
      }),
    target_weight_unit: z.enum(weightUnitType.enumValues),
    training_days: z.array(z.number()).min(1),
    training_frequency: z.number().int().min(0),
    training_duration: z.number().int().min(0),
    activities: z.array(z.string()).min(1),
    health_issues: z.string().nullable(),
    allergies: z.string().nullable(),
    selected_plan: z.string().min(1),
  }
).pick({
  app_user_id: true,
  gender: true,
  birthday: true,
  height: true,
  current_weight: true,
  weight_unit: true,
  height_unit: true,
  main_fitness_goal: true,
  target_weight: true,
  target_weight_unit: true,
  training_days: true,
  training_frequency: true,
  training_duration: true,
  activities: true,
  health_issues: true,
  allergies: true,
  selected_plan: true,
});

export type UserQuestionnaireDTO = z.infer<
  typeof insertUserQuestionnaireSchema
>;

export const jobStatus = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);
export type JobStatus = (typeof jobStatus.enumValues)[number];

export const agentJobs = pgTable(
  "agent_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    status: jobStatus("status").notNull().default("pending"),
    payload: jsonb("payload").notNull(),
    result: jsonb("result"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_agent_jobs_status_created").on(table.status, table.createdAt),
  ]
);

export type AgentJob = typeof agentJobs.$inferSelect;
