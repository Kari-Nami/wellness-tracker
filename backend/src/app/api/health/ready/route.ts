import { CONTRACT_VERSION } from '../../../../types/contracts';
import { connectDb } from '../../../../lib/db/connect';
import { AppError, handleRoute, success } from '../../../../lib/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  return handleRoute(async () => {
    try {
      const db = await connectDb();
      await db.connection.db?.admin().ping();
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
