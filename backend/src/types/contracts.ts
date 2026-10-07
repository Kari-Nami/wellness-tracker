// Generated from contracts/wellness.ts. Edit the source, then run npm run contracts:sync.
import { z } from 'zod';

export const CONTRACT_VERSION = '2.0.0';
export const THAILAND_TIMEZONE = 'Asia/Bangkok';
export const roleSchema = z.enum(['user', 'admin']);
export const sleepQualitySchema = z.enum(['poor', 'fair', 'good', 'great']);
export const moodSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export const alcoholStatusSchema = z.enum([
  'none',
  'light',
  'heavy',
  'blackout',
]);
export const bowelStatusSchema = z.enum([
  'none',
  'uncomfortable',
  'normal',
  'good',
]);
export const completionSchema = z.enum(['missing', 'partial', 'complete']);
export const triggerKeySchema = z.enum([
  'DAILY_CHECKIN_COMPLETE',
  'HABIT_COMPLETE',
  'ALL_DAILY_HABITS_COMPLETE',
  'WATER_GOAL_REACHED',
  'SLEEP_GOAL_REACHED',
  'ALCOHOL_STATUS_LOGGED',
  'CHECKIN_STREAK_7',
  'CHECKIN_STREAK_30',
]);
export const idSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, 'Invalid record identifier.');
export const timestampSchema = z.iso.datetime();
export const localDateSchema = z.iso.date();
export const timezoneSchema = z.literal(THAILAND_TIMEZONE);
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
const descriptionSchema = z.string().trim().max(200);
export const goalsSchema = z
  .object({
    sleepHours: z.number().min(0).max(24).nullable(),
    waterMl: z.number().int().min(0).max(10000).nullable(),
    mealsPerDay: z.number().int().min(0).max(10).nullable(),
    targetMood: moodSchema.nullable(),
    targetBowelStatus: bowelStatusSchema.nullable(),
  })
  .strict();
export const DEFAULT_GOALS = {
  sleepHours: null,
  waterMl: null,
  mealsPerDay: null,
  targetMood: null,
  targetBowelStatus: null,
} satisfies z.infer<typeof goalsSchema>;
export const registerInputSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(8).max(128),
    displayName: z.string().trim().min(1).max(50),
    timezone: timezoneSchema.optional(),
    goals: goalsSchema.optional(),
  })
  .strict();
export const loginInputSchema = z
  .object({ email: emailSchema, password: z.string().min(1).max(128) })
  .strict();
export const userDtoSchema = z
  .object({
    id: idSchema,
    email: emailSchema,
    displayName: z.string(),
    role: roleSchema,
    timezone: timezoneSchema,
    goals: goalsSchema,
    leaderboardEnabled: z.boolean(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();
export const profilePatchSchema = z
  .object({
    displayName: z.string().trim().min(1).max(50).optional(),
    goals: goalsSchema.optional(),
    leaderboardEnabled: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field.');
export const sleepSchema = z
  .object({
    durationMinutes: z.number().int().min(0).max(1440).nullable(),
    quality: sleepQualitySchema.nullable(),
  })
  .strict();
export const mealSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('not_logged') }).strict(),
  z.object({ status: z.literal('skipped') }).strict(),
  z
    .object({
      status: z.literal('eaten'),
      description: descriptionSchema.optional(),
    })
    .strict(),
]);
export const mealsSchema = z
  .object({
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
    snacks: z
      .array(z.object({ description: descriptionSchema.min(1) }).strict())
      .max(10),
  })
  .strict();
export const habitCompletionInputSchema = z
  .object({ habitId: idSchema, completed: z.boolean() })
  .strict();
const habitCompletionInputsSchema = z
  .array(habitCompletionInputSchema)
  .max(100)
  .refine(
    (values) => new Set(values.map((v) => v.habitId)).size === values.length,
    'Habit identifiers must be unique.',
  );
export const checkInFieldsSchema = z
  .object({
    sleep: sleepSchema,
    waterMl: z.number().int().min(0).max(10000).nullable(),
    mood: moodSchema.nullable(),
    meals: mealsSchema,
    alcoholStatus: alcoholStatusSchema.nullable(),
    bowelStatus: bowelStatusSchema.nullable(),
    habitCompletions: habitCompletionInputsSchema,
  })
  .strict();
export const createCheckInInputSchema = checkInFieldsSchema
  .partial()
  .extend({ localDate: localDateSchema })
  .strict();
export const checkInPatchSchema = checkInFieldsSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field.');
export const pointAwardSchema = z
  .object({
    triggerKey: triggerKeySchema,
    instanceKey: z.string(),
    points: z.number().int().min(0).max(100),
    awardedAt: timestampSchema,
  })
  .strict();
export const habitCompletionDtoSchema = habitCompletionInputSchema.extend({
  habitNameSnapshot: z.string(),
});
export const checkInDtoSchema = checkInFieldsSchema.extend({
  id: idSchema,
  localDate: localDateSchema,
  habitCompletions: z.array(habitCompletionDtoSchema),
  pointAwards: z.array(pointAwardSchema),
  pointsEarned: z.number().int().nonnegative(),
  completion: z.enum(['partial', 'complete']),
  completedFieldCount: z.number().int().min(0).max(9),
  requiredFieldCount: z.literal(9),
  currentStreak: z.number().int().nonnegative(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export const checkInSummarySchema = checkInDtoSchema.pick({
  localDate: true,
  completion: true,
  pointsEarned: true,
  completedFieldCount: true,
});
export const habitInputSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: descriptionSchema.optional(),
    active: z.boolean().optional(),
  })
  .strict();
export const habitPatchSchema = habitInputSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field.');
export const habitDtoSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    description: z.string(),
    active: z.boolean(),
    deletedAt: timestampSchema.nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();
export const pointRuleInputSchema = z
  .object({
    triggerKey: triggerKeySchema,
    points: z.number().int().min(0).max(100),
    enabled: z.boolean(),
  })
  .strict();
export const pointRulePatchSchema = pointRuleInputSchema
  .omit({ triggerKey: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field.');
export const pointRuleDtoSchema = pointRuleInputSchema.extend({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export const pointTriggerDtoSchema = z
  .object({ key: triggerKeySchema, label: z.string(), description: z.string() })
  .strict();
export const leaderboardEntrySchema = z
  .object({
    rank: z.number().int().positive(),
    displayName: z.string(),
    points: z.number().int().nonnegative(),
    currentStreak: z.number().int().nonnegative(),
    isCurrentUser: z.boolean(),
  })
  .strict();
export const dateRangeSchema = z
  .object({ from: localDateSchema, to: localDateSchema })
  .strict()
  .refine((v) => {
    const days = (Date.parse(v.to) - Date.parse(v.from)) / 86400000;
    return days >= 0 && days < 365;
  }, 'Choose an inclusive date range of 1 to 365 days.');
const rateSchema = z.number().min(0).max(100).nullable();
const nullableAverageSchema = z.number().nonnegative().nullable();
export const insightDaySchema = z
  .object({
    localDate: localDateSchema,
    completion: completionSchema,
    sleepMinutes: z.number().nullable(),
    waterMl: z.number().nullable(),
    mood: moodSchema.nullable(),
    mealsEaten: z.number().int().nonnegative(),
    mealsLogged: z.number().int().min(0).max(3),
    habitsCompleted: z.number().int().nonnegative(),
    habitsEligible: z.number().int().nonnegative(),
    pointsEarned: z.number().int().nonnegative(),
  })
  .strict();
export const insightsDtoSchema = z
  .object({
    from: localDateSchema,
    to: localDateSchema,
    dayCount: z.number().int().positive(),
    recordedDayCount: z.number().int().nonnegative(),
    completeDayCount: z.number().int().nonnegative(),
    summary: z
      .object({
        averageSleepMinutes: nullableAverageSchema,
        sleepGoalRate: rateSchema,
        averageWaterMl: nullableAverageSchema,
        waterGoalRate: rateSchema,
        averageMood: z.number().min(1).max(5).nullable(),
        checkInCompletionRate: rateSchema,
        habitCompletionRate: rateSchema,
        mealLoggingRate: rateSchema,
        totalPoints: z.number().int().nonnegative(),
        currentStreak: z.number().int().nonnegative(),
        longestStreak: z.number().int().nonnegative(),
      })
      .strict(),
    days: z.array(insightDaySchema),
    alcoholDistribution: z
      .object({
        none: z.number().int().nonnegative(),
        light: z.number().int().nonnegative(),
        heavy: z.number().int().nonnegative(),
        blackout: z.number().int().nonnegative(),
        notLogged: z.number().int().nonnegative(),
      })
      .strict(),
    bowelDistribution: z
      .object({
        none: z.number().int().nonnegative(),
        uncomfortable: z.number().int().nonnegative(),
        normal: z.number().int().nonnegative(),
        good: z.number().int().nonnegative(),
        notLogged: z.number().int().nonnegative(),
      })
      .strict(),
    habits: z.array(
      z
        .object({
          habitId: idSchema,
          name: z.string(),
          completedDays: z.number().int().nonnegative(),
          eligibleDays: z.number().int().nonnegative(),
          completionRate: rateSchema,
        })
        .strict(),
    ),
  })
  .strict();
export const healthDtoSchema = z
  .object({
    status: z.enum(['ok', 'ready']),
    service: z.literal('wellness-tracker-api'),
    contractVersion: z.literal(CONTRACT_VERSION),
  })
  .strict();
export const apiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .strict(),
  })
  .strict();
export const successEnvelope = <T extends z.ZodType>(schema: T) =>
  z.object({ data: schema }).strict();

export type UserDto = z.infer<typeof userDtoSchema>;
export type Goals = z.infer<typeof goalsSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type ProfilePatch = z.infer<typeof profilePatchSchema>;
export type CheckInDto = z.infer<typeof checkInDtoSchema>;
export type CreateCheckInInput = z.infer<typeof createCheckInInputSchema>;
export type CheckInPatch = z.infer<typeof checkInPatchSchema>;
export type CheckInSummary = z.infer<typeof checkInSummarySchema>;
export type HabitDto = z.infer<typeof habitDtoSchema>;
export type HabitInput = z.infer<typeof habitInputSchema>;
export type HabitPatch = z.infer<typeof habitPatchSchema>;
export type PointRuleDto = z.infer<typeof pointRuleDtoSchema>;
export type PointRuleInput = z.infer<typeof pointRuleInputSchema>;
export type PointRulePatch = z.infer<typeof pointRulePatchSchema>;
export type PointTriggerDto = z.infer<typeof pointTriggerDtoSchema>;
export type TriggerKey = z.infer<typeof triggerKeySchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type InsightsDto = z.infer<typeof insightsDtoSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
