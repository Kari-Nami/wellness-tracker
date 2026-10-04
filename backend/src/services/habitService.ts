import { Habit } from '../models/Habit';
import { withUserTransaction } from '../lib/db/transaction';
import { initializeDb } from '../lib/db/initialize';
import { AppError } from '../lib/http';
import { toHabitDto } from '../lib/dto';
import {
  habitInputSchema,
  habitPatchSchema,
  idSchema,
} from '../types/contracts';
export async function listHabits(userId: string, includeArchived: boolean) {
  await initializeDb();
  const habits = await Habit.find({
    userId,
    ...(includeArchived ? {} : { deletedAt: null }),
  }).sort({ createdAt: 1, _id: 1 });
  return habits.map(toHabitDto);
}
export async function getHabit(userId: string, id: string) {
  idSchema.parse(id);
  await initializeDb();
  const habit = await Habit.findOne({ _id: id, userId });
  if (!habit)
    throw new AppError(404, 'NOT_FOUND', 'This habit could not be found.');
  return toHabitDto(habit);
}
export async function createHabit(userId: string, payload: unknown) {
  const input = habitInputSchema.parse(payload);
  return withUserTransaction(userId, async (user, session) => {
    void user;
    if (
      input.active !== false &&
      (await Habit.countDocuments({
        userId,
        active: true,
        deletedAt: null,
      }).session(session)) >= 10
    )
      throw new AppError(
        409,
        'CAPACITY_REACHED',
        'You can have up to ten active habits.',
      );
    const [habit] = await Habit.create([{ ...input, userId }], { session });
    return toHabitDto(habit);
  });
}
export async function updateHabit(
  userId: string,
  id: string,
  payload: unknown,
) {
  idSchema.parse(id);
  const input = habitPatchSchema.parse(payload);
  return withUserTransaction(userId, async (user, session) => {
    void user;
    const habit = await Habit.findOne({ _id: id, userId }).session(session);
    if (!habit)
      throw new AppError(404, 'NOT_FOUND', 'This habit could not be found.');
    if (habit.deletedAt)
      throw new AppError(
        409,
        'CONFLICT',
        'An archived habit cannot be edited.',
      );
    if (
      input.active &&
      !habit.active &&
      (await Habit.countDocuments({
        userId,
        active: true,
        deletedAt: null,
      }).session(session)) >= 10
    )
      throw new AppError(
        409,
        'CAPACITY_REACHED',
        'You can have up to ten active habits.',
      );
    habit.set(input);
    await habit.save({ session });
    return toHabitDto(habit);
  });
}
export async function archiveHabit(userId: string, id: string) {
  idSchema.parse(id);
  return withUserTransaction(userId, async (user, session) => {
    void user;
    const habit = await Habit.findOne({ _id: id, userId }).session(session);
    if (!habit)
      throw new AppError(404, 'NOT_FOUND', 'This habit could not be found.');
    if (!habit.deletedAt) {
      habit.active = false;
      habit.deletedAt = new Date();
      await habit.save({ session });
    }
  });
}
