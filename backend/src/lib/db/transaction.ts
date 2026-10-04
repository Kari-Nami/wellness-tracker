import mongoose, { type ClientSession, type HydratedDocument } from 'mongoose';
import { initializeDb } from './initialize';
import { User, type UserRecord } from '../../models/User';
import { AppError } from '../http';
export async function withUserTransaction<T>(
  userId: string,
  operation: (
    user: HydratedDocument<UserRecord>,
    session: ClientSession,
  ) => Promise<T>,
): Promise<T> {
  await initializeDb();
  return mongoose.connection.transaction(
    async (session) => {
      // Updating this document first serializes writes for one user across server processes.
      const user = await User.findOneAndUpdate(
        { _id: userId },
        { $inc: { mutationRevision: 1 } },
        { returnDocument: 'after', session },
      );
      if (!user)
        throw new AppError(
          401,
          'UNAUTHENTICATED',
          'Please sign in to continue.',
        );
      return operation(user, session);
    },
    {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary',
      maxCommitTimeMS: 10000,
    },
  );
}
