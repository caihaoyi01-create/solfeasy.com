import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

function loadProductionEnv() {
  if (!existsSync('.env.production')) return;
  for (const line of readFileSync('.env.production', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadProductionEnv();

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const build = spawnSync(pnpm, ['run', 'cf:build'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});
if (build.error) throw build.error;
if ((build.status ?? 1) !== 0) process.exit(build.status ?? 1);

const deploy = spawnSync(pnpm, ['exec', 'wrangler', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});
if (deploy.error) throw deploy.error;
process.exit(deploy.status ?? 1);
