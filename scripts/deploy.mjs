import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

// Stale build cache may keep dist/_redirects; it conflicts with wrangler SPA handling.
const distDir = 'apps/web/dist';
const redirects = `${distDir}/_redirects`;
if (existsSync(redirects)) rmSync(redirects);

execSync('npx wrangler deploy', { stdio: 'inherit', env: process.env });
