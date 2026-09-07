import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const viteBin = fileURLToPath(
  new URL('../node_modules/vite/bin/vite.js', import.meta.url)
);
const result = spawnSync(process.execPath, [viteBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, NITRO_PRESET: 'cloudflare_module' },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
