import { connectDb } from './connect';
import { User } from '../../models/User';
import { Habit } from '../../models/Habit';
import { DailyCheckIn } from '../../models/DailyCheckIn';
import { PointRule } from '../../models/PointRule';
export async function initializeDb() {
  await connectDb();
  await User.init();
  await Habit.init();
  await DailyCheckIn.init();
  await PointRule.init();
}
