import type { Types } from 'mongoose';
import {
  userDtoSchema,
  THAILAND_TIMEZONE,
  habitDtoSchema,
  pointRuleDtoSchema,
  checkInDtoSchema,
} from '../types/contracts';
import { completedFieldCount, completionOf } from '../services/completion';
import type { CheckInRecord } from '../models/DailyCheckIn';
import type { UserRecord } from '../models/User';
import type { HabitRecord } from '../models/Habit';
import type { PointRuleRecord } from '../models/PointRule';
export function toUserDto(user: UserRecord & { _id: Types.ObjectId }) {
  return userDtoSchema.parse({
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    timezone: THAILAND_TIMEZONE,
    goals: {
      sleepHours: user.goals.sleepHours,
      waterMl: user.goals.waterMl,
      mealsPerDay: user.goals.mealsPerDay,
      targetMood: user.goals.targetMood ?? null,
      targetBowelStatus: user.goals.targetBowelStatus ?? null,
    },
    leaderboardEnabled: user.leaderboardEnabled,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}
export function toHabitDto(habit: HabitRecord & { _id: Types.ObjectId }) {
  return habitDtoSchema.parse({
    id: String(habit._id),
    name: habit.name,
    description: habit.description ?? '',
    active: habit.active,
    deletedAt: habit.deletedAt?.toISOString() ?? null,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
  });
}
export function toPointRuleDto(
  rule: PointRuleRecord & { _id: Types.ObjectId },
) {
  return pointRuleDtoSchema.parse({
    id: String(rule._id),
    triggerKey: rule.triggerKey,
    points: rule.points,
    enabled: rule.enabled,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  });
}

export function toCheckInDto(
  record: CheckInRecord & { _id: Types.ObjectId },
  currentStreak = 0,
) {
  const meal = (value: CheckInRecord['meals']['breakfast']) =>
    value.status === 'eaten'
      ? {
          status: 'eaten',
          ...(value.description ? { description: value.description } : {}),
        }
      : { status: value.status };
  return checkInDtoSchema.parse({
    id: String(record._id),
    localDate: record.localDate,
    sleep: {
      durationMinutes: record.sleep.durationMinutes ?? null,
      quality: record.sleep.quality ?? null,
    },
    waterMl: record.waterMl ?? null,
    mood: record.mood ?? null,
    meals: {
      breakfast: meal(record.meals.breakfast),
      lunch: meal(record.meals.lunch),
      dinner: meal(record.meals.dinner),
      snacks: record.meals.snacks.map((s) => ({ description: s.description })),
    },
    alcoholStatus: record.alcoholStatus ?? null,
    bowelStatus: record.bowelStatus ?? null,
    habitCompletions: record.habitCompletions.map((h) => ({
      habitId: String(h.habitId),
      habitNameSnapshot: h.habitNameSnapshot,
      completed: h.completed,
    })),
    pointAwards: record.pointAwards.map((a) => ({
      triggerKey: a.triggerKey,
      instanceKey: a.instanceKey,
      points: a.points,
      awardedAt: a.awardedAt.toISOString(),
    })),
    pointsEarned: record.pointAwards.reduce((n, a) => n + a.points, 0),
    completion: completionOf(record),
    completedFieldCount: completedFieldCount(record),
    requiredFieldCount: 9,
    currentStreak,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}
