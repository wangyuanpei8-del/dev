import { existsSync, rmSync } from 'node:fs';

if (existsSync('apps/web/dist')) {
  rmSync('apps/web/dist', { recursive: true, force: true });
}
