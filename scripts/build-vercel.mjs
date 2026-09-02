import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';

const projectRoot = process.cwd();
const outputRoot = resolve(projectRoot, '.vercel/output');

await build({
  configFile: resolve(projectRoot, 'vercel.vite.config.ts'),
});

await mkdir(outputRoot, { recursive: true });
await writeFile(
  resolve(outputRoot, 'config.json'),
  `${JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: 'filesystem' },
        { src: '/.*', dest: '/index.html' },
      ],
    },
    null,
    2,
  )}\n`,
);
