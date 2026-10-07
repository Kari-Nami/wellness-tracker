import {
  DEFAULT_GOALS,
  POINT_TRIGGER_DEFINITIONS,
  type UserDto,
  type CheckInDto,
  type HabitDto,
  type PointRuleDto,
  type PointTriggerDto,
} from '../types/contracts';
import { detectedTimezone, todayInZone, shiftDate } from '../lib/dates';
import { emptyCheckIn } from '../features/checkIn/model';
export const DEMO_PASSWORD = 'wellness123';
export const DEMO_MEMBER_EMAIL = 'alex@example.com';
export const DEMO_ADMIN_EMAIL = 'admin@example.com';
export interface DemoAccount {
  user: UserDto;
  passwordHash: string;
}
export interface DemoDatabase {
  accounts: DemoAccount[];
  records: Record<string, Record<string, CheckInDto>>;
  habits: Record<string, HabitDto[]>;
  rules: PointRuleDto[];
}
export const makeId = () =>
  crypto.randomUUID().replaceAll('-', '').slice(0, 24);
export const triggerDefinitions: PointTriggerDto[] =
  POINT_TRIGGER_DEFINITIONS.map(({ key, label, description }) => ({
    key,
    label,
    description,
  }));
export function createDemoDatabase(): DemoDatabase {
  const timezone = detectedTimezone();
  const today = todayInZone(timezone);
  const now = new Date().toISOString();
  const createdAt = `${shiftDate(today, -90)}T00:00:00.000Z`;
  const member: UserDto = {
    id: '000000000000000000000001',
    email: DEMO_MEMBER_EMAIL,
    displayName: 'Alex Morgan',
    role: 'user',
    timezone,
    goals: { ...DEFAULT_GOALS, sleepHours: 8, waterMl: 2000, mealsPerDay: 3 },
    leaderboardEnabled: true,
    createdAt,
    updatedAt: now,
  };
  const admin: UserDto = {
    ...member,
    id: '000000000000000000000002',
    email: DEMO_ADMIN_EMAIL,
    displayName: 'Sam Taylor',
    role: 'admin',
    leaderboardEnabled: false,
  };
  const habits = [
    'Move for 30 minutes',
    'Read a few pages',
    'A moment of mindfulness',
  ].map((name, index): HabitDto => ({
    id: `00000000000000000000001${index}`,
    name,
    description: [
      'A walk, a workout, or something in between.',
      'A little time away from the screen.',
      'Slow down and take a few deep breaths.',
    ][index],
    active: true,
    deletedAt: null,
    createdAt,
    updatedAt: now,
  }));
  const rules = triggerDefinitions.map((trigger, index): PointRuleDto => ({
    id: (256 + index).toString(16).padStart(24, '0'),
    triggerKey: trigger.key,
    points: POINT_TRIGGER_DEFINITIONS[index].defaultPoints,
    enabled: true,
    createdAt,
    updatedAt: now,
  }));
  const records: Record<string, CheckInDto> = {};
  for (let offset = 59; offset >= 0; offset--) {
    if (offset > 12 && offset % 11 === 0) continue;
    const localDate = shiftDate(today, -offset);
    const partial = offset === 0 || (offset > 12 && offset % 9 === 0);
    const draft = emptyCheckIn();
    draft.sleep = {
      durationMinutes: 405 + (offset % 6) * 15,
      quality: offset % 4 === 0 ? 'great' : 'good',
    };
    draft.waterMl = offset === 0 ? 1250 : 1500 + (offset % 5) * 250;
    draft.mood = offset % 6 === 0 ? 3 : offset % 3 === 0 ? 5 : 4;
    draft.meals = {
      breakfast: { status: 'eaten', description: 'Yogurt, berries & granola' },
      lunch: { status: 'eaten', description: 'Rice bowl with vegetables' },
      dinner: partial
        ? { status: 'not_logged' }
        : { status: 'eaten', description: 'Grilled fish and a fresh salad' },
      snacks: [],
    };
    draft.alcoholStatus = partial ? null : offset % 8 === 0 ? 'light' : 'none';
    draft.bowelStatus = partial ? null : 'normal';
    const completed = habits.map((habit, i) => ({
      habitId: habit.id,
      habitNameSnapshot: habit.name,
      completed: offset === 0 ? i === 1 : offset % 7 !== i,
    }));
    records[localDate] = {
      ...draft,
      id: makeId(),
      localDate,
      habitCompletions: completed,
      completion: partial ? 'partial' : 'complete',
      completedFieldCount: partial ? 6 : 9,
      requiredFieldCount: 9,
      pointAwards: [],
      pointsEarned: 0,
      currentStreak: 12,
      createdAt: `${localDate}T08:00:00.000Z`,
      updatedAt: now,
    };
  }
  return {
    accounts: [member, admin].map((user) => ({
      user,
      passwordHash:
        'e7c7b1d860258de3f82b5c782ee1628e6958325a6db90aee788630a4d7b62688',
    })),
    records: { [member.id]: records, [admin.id]: {} },
    habits: { [member.id]: habits, [admin.id]: [] },
    rules,
  };
}
