import { config } from 'dotenv';
import mongoose from 'mongoose';
import { seedAdmin, seedPointRules } from '../src/services/seedService';
import { seedDemoAccounts } from '../src/services/demoSeedService';
config({ path: '.env.local', quiet: true });
config({ quiet: true });
const mode = process.argv[2];
if (!['rules', 'admin', 'demo', 'all'].includes(mode ?? ''))
  throw new Error('Usage: npm run seed -- rules|admin|demo|all');
try {
  if (mode === 'admin' || mode === 'all') {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD)
      throw new Error(
        'Set ADMIN_EMAIL and ADMIN_PASSWORD for operator creation.',
      );
    await seedAdmin({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: process.env.ADMIN_DISPLAY_NAME ?? 'Administrator',
      timezone: process.env.ADMIN_TIMEZONE ?? 'UTC',
    });
  }
  if (mode === 'rules' || mode === 'demo' || mode === 'all')
    await seedPointRules();
  if (mode === 'demo' || mode === 'all') await seedDemoAccounts();
  console.log(
    'Requested seed completed. Existing passwords and rule configuration were preserved.',
  );
} catch {
  console.error('Seed failed. Check input settings and database availability.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
