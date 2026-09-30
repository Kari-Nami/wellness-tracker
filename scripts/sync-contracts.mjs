import { mkdir, readFile, writeFile } from 'node:fs/promises';
const source = await readFile(
  new URL('../contracts/wellness.ts', import.meta.url),
  'utf8',
);
const expected =
  '// Generated from contracts/wellness.ts. Edit the source, then run npm run contracts:sync.\n' +
  source;
for (const app of ['frontend', 'backend']) {
  const target = new URL(`../${app}/src/types/contracts.ts`, import.meta.url);
  if (process.argv.includes('--check')) {
    if ((await readFile(target, 'utf8')) !== expected)
      throw new Error(`${app} contracts are out of sync`);
  } else {
    await mkdir(new URL(`../${app}/src/types/`, import.meta.url), {
      recursive: true,
    });
    await writeFile(target, expected);
  }
}
console.log(
  process.argv.includes('--check')
    ? 'Contracts match.'
    : 'Contracts synchronized.',
);
