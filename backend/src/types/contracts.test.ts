import { describe, expect, it } from 'vitest';
import {
  checkInPatchSchema,
  createCheckInInputSchema,
  dateRangeSchema,
  localDateSchema,
  pointRuleInputSchema,
  registerInputSchema,
  DEFAULT_GOALS,
} from './contracts';
describe('shared request contracts', () => {
  it('distinguishes explicit zero and none from missing entries', () => {
    expect(
      checkInPatchSchema.parse({ waterMl: 0, alcoholStatus: 'none' }),
    ).toEqual({ waterMl: 0, alcoholStatus: 'none' });
    expect(
      checkInPatchSchema.parse({ waterMl: null, alcoholStatus: null }),
    ).toEqual({ waterMl: null, alcoholStatus: null });
  });
  it('allows a date-only partial check-in and rejects trusted fields', () => {
    expect(createCheckInInputSchema.parse({ localDate: '2026-10-07' })).toEqual(
      { localDate: '2026-10-07' },
    );
    expect(
      createCheckInInputSchema.safeParse({
        localDate: '2026-10-07',
        pointAwards: [],
      }).success,
    ).toBe(false);
    expect(
      createCheckInInputSchema.safeParse({
        localDate: '2026-10-07',
        userId: 'forged',
      }).success,
    ).toBe(false);
  });
  it('requires whole nested categories and rejects duplicate habits', () => {
    expect(
      checkInPatchSchema.safeParse({ sleep: { quality: 'good' } }).success,
    ).toBe(false);
    const habit = { habitId: '000000000000000000000001', completed: true };
    expect(
      checkInPatchSchema.safeParse({ habitCompletions: [habit, habit] })
        .success,
    ).toBe(false);
  });
  it('rejects invalid dates and overlong or reversed ranges', () => {
    expect(localDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(localDateSchema.safeParse('2024-02-29').success).toBe(true);
    expect(
      dateRangeSchema.safeParse({ from: '2026-10-07', to: '2026-10-06' })
        .success,
    ).toBe(false);
    expect(
      dateRangeSchema.safeParse({ from: '2025-10-07', to: '2026-10-07' })
        .success,
    ).toBe(false);
  });
  it('prevents role selection on public registration', () => {
    expect(
      registerInputSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test',
        timezone: 'Asia/Bangkok',
        role: 'admin',
      }).success,
    ).toBe(false);
  });
  it('restricts point rules to known triggers and integer values', () => {
    expect(
      pointRuleInputSchema.safeParse({
        triggerKey: 'CUSTOM_CODE',
        points: 10,
        enabled: true,
      }).success,
    ).toBe(false);
    expect(
      pointRuleInputSchema.safeParse({
        triggerKey: 'HABIT_COMPLETE',
        points: 3.5,
        enabled: true,
      }).success,
    ).toBe(false);
    expect(DEFAULT_GOALS.waterMl).toBe(2000);
  });
});
