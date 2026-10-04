import type { Types } from 'mongoose';
import {
  userDtoSchema,
  habitDtoSchema,
  pointRuleDtoSchema,
} from '../types/contracts';
import type { UserRecord } from '../models/User';
import type { HabitRecord } from '../models/Habit';
import type { PointRuleRecord } from '../models/PointRule';
export function toUserDto(user: UserRecord & { _id: Types.ObjectId }) {
  return userDtoSchema.parse({
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    timezone: user.timezone,
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
