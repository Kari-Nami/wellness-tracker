import { mkdir, readFile, writeFile } from 'node:fs/promises';
for (const [file, targetName] of [
  ['wellness.ts', 'contracts.ts'],
  ['demoAccounts.ts', 'demoAccounts.ts'],
]) {
  const source = await readFile(
    new URL(`../contracts/${file}`, import.meta.url),
    'utf8',
  );
  const expected =
    `// Generated from contracts/${file}. Edit the source, then run npm run contracts:sync.\n` +
    source;
  for (const app of ['frontend', 'backend']) {
    const target = new URL(
      `../${app}/src/types/${targetName}`,
      import.meta.url,
    );
    if (process.argv.includes('--check')) {
      if ((await readFile(target, 'utf8')) !== expected)
        throw new Error(`${app} ${targetName} is out of sync`);
    } else {
      await mkdir(new URL(`../${app}/src/types/`, import.meta.url), {
        recursive: true,
      });
      await writeFile(target, expected);
    }
  }
}
console.log(
  process.argv.includes('--check')
    ? 'Contracts match.'
    : 'Contracts synchronized.',
);
