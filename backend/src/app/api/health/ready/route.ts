import { CONTRACT_VERSION } from '../../../../types/contracts';
import { initializeDb } from '../../../../lib/db/initialize';
import mongoose from 'mongoose';
import { AppError, handleRoute, success } from '../../../../lib/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  return handleRoute(async () => {
    try {
      await initializeDb();
      const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
      if (!hello.isWritablePrimary || hello.setName !== 'rs0')
        throw new Error('A writable replica set is required.');
    } catch {
      throw new AppError(
        503,
        'DEPENDENCY_UNAVAILABLE',
        'The database is unavailable.',
      );
    }
    return success({
      status: 'ready',
      service: 'wellness-tracker-api',
      contractVersion: CONTRACT_VERSION,
    });
  });
}
