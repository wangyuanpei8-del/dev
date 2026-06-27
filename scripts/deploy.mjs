import { execSync } from 'node:child_process';

// Workers Builds injects CLOUDFLARE_API_TOKEN automatically — do not strip it.
execSync('npx wrangler deploy', { stdio: 'inherit', env: process.env });
