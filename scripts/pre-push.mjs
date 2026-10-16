import { readFileSync } from 'node:fs';
import { checkPublish, git } from './site-safety.mjs';

try {
  const remoteUrl = process.argv[3];
  if (!remoteUrl) throw new Error('Missing Git remote URL. This script runs through the pre-push hook.');
  const updates = readFileSync(0, 'utf8').trim().split('\n').filter(Boolean);
  for (const line of updates) {
    const [, local, remoteRef, advertised] = line.split(/\s+/);
    if (remoteRef !== 'refs/heads/main') continue;
    const latest = git(process.cwd(), 'ls-remote', '--heads', remoteUrl, 'refs/heads/main').split(/\s+/)[0];
    if (!latest || latest !== advertised) throw new Error('The live branch changed during this push. Fetch origin and review the newer changes before retrying.');
    const count = checkPublish(process.cwd(), local, latest);
    console.log(`Publish safety passed: latest published changes retained; complete footers on ${count} pages.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
