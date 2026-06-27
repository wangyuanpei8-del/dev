import { execSync } from 'node:child_process';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

// Cloudflare Pages sets CF_PAGES=1 during Git builds
if (process.env.CF_PAGES === '1') {
  run('npm ci --prefix apps/web');
  run('npm run build --prefix apps/web');
} else {
  run('pnpm -r run build');
}
