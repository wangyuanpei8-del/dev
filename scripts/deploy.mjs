import { execSync } from 'node:child_process';

// Custom CLOUDFLARE_API_TOKEN in build env often lacks Pages/Workers write scope
// and overrides Cloudflare's built-in OIDC credentials. Prefer platform auth.
const env = { ...process.env };
delete env.CLOUDFLARE_API_TOKEN;
delete env.CF_API_TOKEN;

execSync('npx wrangler deploy', { stdio: 'inherit', env });
