import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('data', { recursive: true });
execFileSync(process.execPath, ['scripts/db-setup.mjs'], { stdio: 'inherit' });
