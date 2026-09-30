import { CONTRACT_VERSION } from '../../../types/contracts';
import { success } from '../../../lib/http';
export const dynamic = 'force-dynamic';
export function GET() {
  return success({
    status: 'ok',
    service: 'wellness-tracker-api',
    contractVersion: CONTRACT_VERSION,
  });
}
