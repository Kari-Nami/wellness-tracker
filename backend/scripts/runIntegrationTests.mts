import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
const suffix = randomUUID().replaceAll('-', '');
const name = `daywell-test-${suffix}`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  console.log('Starting an isolated MongoDB integration database.');
  execFileSync(
    'docker',
    [
      'run',
      '--rm',
      '--detach',
      '--name',
      name,
      '-p',
      '127.0.0.1::27017',
      'mongo:8.2',
      'mongod',
      '--replSet',
      'rs0',
      '--bind_ip_all',
    ],
    { stdio: 'pipe' },
  );
  const mapped = execFileSync('docker', ['port', name, '27017/tcp'], {
    encoding: 'utf8',
  }).trim();
  const port = Number(mapped.split(':').at(-1));
  const uri = `mongodb://127.0.0.1:${port}/wellness_test_${suffix}?replicaSet=rs0&directConnection=true`;
  const client = new mongoose.mongo.MongoClient(uri, {
    serverSelectionTimeoutMS: 500,
  });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      await client.connect();
      const admin = client.db('admin');
      try {
        await admin.command({
          replSetInitiate: {
            _id: 'rs0',
            members: [{ _id: 0, host: 'localhost:27017' }],
          },
        });
      } catch (error) {
        if (!(
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 23
        ))
          throw error;
      }
      const hello = await admin.command({ hello: 1 });
      if (hello.isWritablePrimary) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the new test primary to become available. */
    }
    await sleep(250);
  }
  await client.close();
  if (!ready)
    throw new Error('The isolated MongoDB primary did not become ready.');
  const executable = fileURLToPath(
    new URL('../node_modules/vitest/vitest.mjs', import.meta.url),
  );
  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [executable, 'run', '--config', 'vitest.integration.config.mts'],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          MONGODB_URI: uri,
          TEST_MONGODB_URI: uri,
          JWT_SECRET: randomUUID() + randomUUID(),
          APP_ORIGIN: 'http://localhost:5173',
          PUBLIC_BASE_PATH: '/',
          LOG_LEVEL: 'silent',
        },
      },
    );
    child.once('error', reject);
    child.once('exit', (result) => resolve(result ?? 1));
  });
  process.exitCode = code;
} finally {
  try {
    execFileSync('docker', ['rm', '--force', name], { stdio: 'pipe' });
  } catch {
    /* The disposable container may already have exited. */
  }
}
