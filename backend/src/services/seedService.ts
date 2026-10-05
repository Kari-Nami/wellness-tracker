import { PointRule } from '../models/PointRule';
import { User } from '../models/User';
import { initializeDb } from '../lib/db/initialize';
import { hashPassword } from '../lib/auth/passwords';
import { registerInputSchema } from '../types/contracts';
import { triggerRegistry } from './triggerRegistry';
export async function seedPointRules() {
  await initializeDb();
  for (const trigger of triggerRegistry)
    await PointRule.updateOne(
      { triggerKey: trigger.key },
      {
        $setOnInsert: {
          triggerKey: trigger.key,
          points: trigger.defaultPoints,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, timestamps: false },
    );
}
export async function seedAdmin(payload: unknown) {
  const input = registerInputSchema.parse(payload);
  await initializeDb();
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    existing.role = 'admin';
    existing.leaderboardEnabled = false;
    await existing.save();
    return;
  }
  const { password, ...fields } = input;
  await User.create({
    ...fields,
    passwordHash: await hashPassword(password),
    role: 'admin',
    leaderboardEnabled: false,
  });
}
