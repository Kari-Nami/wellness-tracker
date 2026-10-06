import { DEMO_ACCOUNTS } from '../types/demoAccounts';
import { DEFAULT_GOALS, type CreateCheckInInput } from '../types/contracts';
import { User } from '../models/User';
import { Habit } from '../models/Habit';
import { DailyCheckIn } from '../models/DailyCheckIn';
import { initializeDb } from '../lib/db/initialize';
import { withUserTransaction } from '../lib/db/transaction';
import { hashPassword } from '../lib/auth/passwords';
import { todayInZone, shiftDate } from '../lib/dates';
import { toHabitDto } from '../lib/dto';
import { rowsForDate } from './habitEligibility';
import { reconcileAwards } from './scoringService';
const routines = [
  [
    {
      name: 'Morning walk',
      description: 'Twenty minutes outside before the day gets busy.',
    },
    {
      name: 'Read a few pages',
      description: 'Make a little room for a good book.',
    },
    { name: 'Evening stretch', description: 'A gentle wind-down before bed.' },
  ],
  [
    {
      name: 'Move for 30 minutes',
      description: 'Walking, cycling, or a favorite workout.',
    },
    {
      name: 'Five-minute journal',
      description: 'Notice one good thing and one thing to work on.',
    },
    {
      name: 'Screen-free bedtime',
      description: 'Put the phone away before settling in.',
    },
  ],
  [
    { name: 'Step outside', description: 'A short fresh-air break.' },
    {
      name: 'Practice guitar',
      description: 'Ten minutes of a song worth learning.',
    },
    {
      name: 'Prepare tomorrow',
      description: 'One small task to make the next day easier.',
    },
  ],
];
function sampleDay(
  localDate: string,
  index: number,
  profile: number,
): CreateCheckInInput | null {
  const recentRun = profile === 1 ? index >= 60 : index >= 82;
  if (profile === 1 && index === 59) return null;
  if (!recentRun && (index + profile * 3) % 17 === 0) return null;
  const partial =
    (profile === 0 && index === 89) ||
    (profile !== 1 && index === 81) ||
    (!recentRun && (index + profile) % 11 === 0);
  const water = [1800, 2250, 2500, 2000, 2750, 1500, 3000][
    (index + profile) % 7
  ];
  const sleep = [420, 465, 510, 450, 480, 390, 495][(index * 3 + profile) % 7];
  const dinner = [
    'Vegetable curry and rice',
    'Salmon with greens',
    'Noodles and roasted vegetables',
    'Chicken and sweet potato',
  ][index % 4];
  return {
    localDate,
    sleep: {
      durationMinutes: sleep,
      quality: sleep >= 480 ? 'great' : sleep >= 420 ? 'good' : 'fair',
    },
    waterMl: partial ? null : water,
    mood: partial
      ? null
      : ([3, 4, 4, 5, 3, 4, 5] as const)[(index + profile * 2) % 7],
    meals: {
      breakfast: {
        status: 'eaten',
        description:
          index % 2 ? 'Oatmeal, banana, and coffee' : 'Eggs, toast, and fruit',
      },
      lunch:
        index % 13 === 0
          ? { status: 'skipped' }
          : {
              status: 'eaten',
              description:
                index % 2
                  ? 'Rice bowl with vegetables'
                  : 'Soup and a wholegrain sandwich',
            },
      dinner: { status: 'eaten', description: dinner },
      snacks:
        index % 3 === 0
          ? [{ description: 'Apple and a handful of almonds' }]
          : [],
    },
    alcoholStatus:
      index % 29 === 0 ? 'heavy' : index % 8 === 0 ? 'light' : 'none',
    bowelStatus:
      index % 19 === 0
        ? 'none'
        : index % 9 === 0
          ? 'uncomfortable'
          : index % 3 === 0
            ? 'good'
            : 'normal',
  };
}
export async function seedDemoAccounts() {
  await initializeDb();
  for (let profile = 0; profile < DEMO_ACCOUNTS.length; profile++) {
    const demo = DEMO_ACCOUNTS[profile];
    let account = await User.findOne({ email: demo.email });
    if (account && account.demoKey !== demo.key)
      throw new Error(
        'A demo address belongs to an existing personal account. No data was changed for that account.',
      );
    if (!account)
      account = await User.create({
        email: demo.email,
        displayName: demo.displayName,
        passwordHash: await hashPassword(demo.password),
        role: demo.role,
        leaderboardEnabled: demo.role === 'user',
        timezone: 'Asia/Bangkok',
        goals: {
          ...DEFAULT_GOALS,
          waterMl: [2000, 2500, 1800][profile] ?? DEFAULT_GOALS.waterMl,
          sleepHours: [8, 7.5, 8][profile] ?? DEFAULT_GOALS.sleepHours,
          targetMood: 4,
        },
        demoKey: demo.key,
      });
    await withUserTransaction(String(account._id), async (user, session) => {
      if (user.demoKey !== demo.key || user.role !== demo.role)
        throw new Error('Demo seeds are limited to their marked accounts.');
      if (demo.role === 'admin') return;
      const today = todayInZone(user.timezone);
      if (!user.demoHabitIds.length) {
        const habits = await Habit.create(
          routines[profile].map((r) => ({
            ...r,
            userId: user._id,
            createdAt: new Date(shiftDate(today, -89) + 'T00:00:00Z'),
          })),
          { session, ordered: true },
        );
        user.demoHabitIds = habits.map((h) => h._id);
        await user.save({ session });
      }
      const habits = (
        await Habit.find({
          userId: user._id,
          _id: { $in: user.demoHabitIds },
        }).session(session)
      ).map(toHabitDto);
      const existing = new Set(
        (
          await DailyCheckIn.find({ userId: user._id })
            .select('localDate')
            .session(session)
            .lean()
        ).map((r) => r.localDate),
      );
      const dates = new Set<string>();
      const records = [];
      for (let index = 0; index < 90; index++) {
        const date = shiftDate(today, index - 89);
        if (existing.has(date)) continue;
        const fields = sampleDay(date, index, profile);
        if (!fields) continue;
        const rows = rowsForDate(habits, date, user.timezone).map(
          (h, habitIndex) => ({
            ...h,
            completed:
              profile === 1 || (index + habitIndex + profile) % 5 !== 0,
          }),
        );
        const timestamp = new Date(
          Math.min(Date.parse(date + 'T12:00:00Z'), Date.now()),
        );
        records.push({
          ...fields,
          userId: user._id,
          habitCompletions: rows,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        dates.add(date);
      }
      if (records.length) {
        await DailyCheckIn.insertMany(records, { session });
        await reconcileAwards(user, dates, session);
      }
    });
  }
}
