import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const command = process.argv[2] ?? 'dev';
const args = process.argv.slice(3);
const root = process.cwd();
const env = { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' };

function runAstro(cwd) {
  const astroBin = path.join(cwd, 'node_modules', 'astro', 'bin', 'astro.mjs');
  return spawnSync(process.execPath, [astroBin, command, ...args], {
    cwd,
    env,
    stdio: 'inherit'
  });
}

function findAvailableDrive() {
  for (const letter of 'YXWVU') {
    const drive = `${letter}:`;
    if (!existsSync(`${drive}\\`)) return drive;
  }

  return null;
}

if (process.platform === 'win32' && /\s/.test(root)) {
  const drive = findAvailableDrive();

  if (drive) {
    const mount = spawnSync('subst', [drive, root], { stdio: 'inherit' });

    if (mount.status === 0) {
      try {
        const result = runAstro(`${drive}\\`);
        process.exitCode = result.status ?? 1;
      } finally {
        spawnSync('subst', [drive, '/D'], { stdio: 'ignore' });
      }
    } else {
      process.exitCode = mount.status ?? 1;
    }
  } else {
    const result = runAstro(root);
    process.exitCode = result.status ?? 1;
  }
} else {
  const result = runAstro(root);
  process.exitCode = result.status ?? 1;
}
