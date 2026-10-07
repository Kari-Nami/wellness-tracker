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
export async function listHabits(userId: string) {
  await initializeDb();
  const habits = await Habit.find({
    userId,
    deletedAt: null,
  }).sort({ createdAt: 1, _id: 1 });
  return habits.map(toHabitDto);
}
export async function getHabit(userId: string, id: string) {
  idSchema.parse(id);
  await initializeDb();
  const habit = await Habit.findOne({ _id: id, userId, deletedAt: null });
  if (!habit)
    throw new AppError(404, 'NOT_FOUND', 'This habit could not be found.');
  return toHabitDto(habit);
}
export async function createHabit(userId: string, payload: unknown) {
  const input = habitInputSchema.parse(payload);
  return withUserTransaction(userId, async (user, session) => {
    void user;
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
    const habit = await Habit.findOne({
      _id: id,
      userId,
      deletedAt: null,
    }).session(session);
    if (!habit)
      throw new AppError(404, 'NOT_FOUND', 'This habit could not be found.');
    habit.set(input);
    await habit.save({ session });
    return toHabitDto(habit);
  });
}
export async function deleteHabit(userId: string, id: string) {
  idSchema.parse(id);
  return withUserTransaction(userId, async (user, session) => {
    void user;
    const habit = await Habit.findOne({
      _id: id,
      userId,
      deletedAt: null,
    }).session(session);
    if (!habit)
      throw new AppError(404, 'NOT_FOUND', 'This habit could not be found.');
    habit.active = false;
    habit.deletedAt = new Date();
    await habit.save({ session });
  });
}
