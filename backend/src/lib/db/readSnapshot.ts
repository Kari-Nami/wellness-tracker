import mongoose, { type ClientSession } from 'mongoose';
import { initializeDb } from './initialize';
export async function readSnapshot<T>(
  operation: (session: ClientSession) => Promise<T>,
): Promise<T> {
  await initializeDb();
  return mongoose.connection.transaction(operation, {
    readConcern: { level: 'snapshot' },
    readPreference: 'primary',
    maxCommitTimeMS: 10000,
  });
}
