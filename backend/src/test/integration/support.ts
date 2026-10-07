import mongoose from 'mongoose';
import { initializeDb } from '../../lib/db/initialize';
import { registerUser } from '../../services/authService';
import { User } from '../../models/User';
import { createSession } from '../../lib/auth/session';
export async function prepareDatabase() {
  const uri = process.env.TEST_MONGODB_URI;
  const database = uri?.match(/\/(wellness_test_[a-f0-9]+)\?/);
  if (!uri || !database || uri !== process.env.MONGODB_URI)
    throw new Error(
      'Integration tests require their isolated wellness_test database.',
    );
  await initializeDb();
}
export async function clearDatabase() {
  if (!mongoose.connection.name.startsWith('wellness_test_'))
    throw new Error('Refusing to clear a non-test database.');
  for (const collection of Object.values(mongoose.connection.collections))
    await collection.deleteMany({});
}
export function request(
  path: string,
  method = 'GET',
  payload?: unknown,
  cookie?: string,
) {
  return new Request(`http://localhost:3000/api${path}`, {
    method,
    headers: {
      Origin: process.env.APP_ORIGIN!,
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
}
export async function account(name = 'Member', admin = false) {
  const user = await registerUser({
    email: `${name.toLowerCase().replaceAll(' ', '')}@example.com`,
    displayName: name,
    password: 'integration-password',
    goals: {
      sleepHours: 8,
      waterMl: 2000,
      mealsPerDay: 3,
      targetMood: null,
      targetBowelStatus: null,
    },
  });
  if (admin) {
    await User.updateOne(
      { _id: user.id },
      { $set: { role: 'admin', leaderboardEnabled: false } },
    );
    user.role = 'admin';
  }
  return { user, cookie: `wellness_session=${await createSession(user)}` };
}
