import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
}

export function footerErrors(html, expected) {
  const footers = html.match(/<footer\b[\s\S]*?<\/footer>/gi) ?? [];
  if (footers.length !== 1) return ['Expected exactly one complete footer.'];
  const links = [...footers[0].matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: match[2], label: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }));
  const errors = [];
  if (JSON.stringify(links) !== JSON.stringify(expected)) {
    for (const link of expected) {
      const count = links.filter((item) => item.href === link.href && item.label === link.label).length;
      if (count !== 1) errors.push(`${link.label} (${link.href}): expected once, found ${count}.`);
    }
    if (!errors.length) errors.push('Footer links, labels, or order differ from scripts/footer-links.json.');
  }
  const community = footers[0].match(/<p\b[^>]*class=["']footer-group-label["'][^>]*>Community<\/p>\s*<ul>([\s\S]*?)<\/ul>/i);
  if (!community?.[1].includes('href="/partners/"')) errors.push('Community Partners must be under Community.');
  return errors;
}

export function checkSite(cwd, ref = 'HEAD') {
  const files = git(cwd, 'ls-tree', '-r', '--name-only', ref).split('\n');
  const expected = JSON.parse(readFileSync(new URL('./footer-links.json', import.meta.url), 'utf8'));
  const errors = [];
  const pages = files.filter((file) => file.endsWith('.html'));
  if (!pages.length) throw new Error('No HTML pages found in the proposed commit.');
  for (const file of pages) {
    const html = git(cwd, 'show', `${ref}:${file}`);
    errors.push(...footerErrors(html, expected).map((error) => `${file}: ${error}`));
  }
  for (const { href } of expected) {
    if (!href.startsWith('/')) continue;
    const file = href === '/' ? 'index.html' : href.slice(1) + (href.endsWith('/') ? 'index.html' : '');
    if (!files.includes(file)) errors.push(`Footer destination is missing: ${href}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return pages.length;
}

export function checkPublish(cwd, local, remote) {
  if (/^0+$/.test(local)) throw new Error('Deleting the publishing branch is blocked.');
  if (/^0+$/.test(remote)) throw new Error('The publishing branch must already exist.');
  try { git(cwd, 'merge-base', '--is-ancestor', remote, local); }
  catch { throw new Error('Publish blocked: the proposed commit does not include the latest published changes. Fetch origin and start from origin/main; never force-push.'); }
  const deleted = git(cwd, 'diff', '--name-only', '--diff-filter=D', remote, local);
  if (deleted) throw new Error(`Publish blocked: existing files would be deleted. Review these removals separately:\n${deleted}`);
  const changed = git(cwd, 'diff', '--name-only', '--diff-filter=M', remote, local).split('\n').filter(Boolean);
  for (const file of changed) {
    const proposed = git(cwd, 'rev-parse', `${local}:${file}`);
    const current = git(cwd, 'rev-parse', `${remote}:${file}`);
    if (proposed === current) continue;
    const history = git(cwd, 'log', '-30', '--format=%H', remote, '--', file).split('\n').filter(Boolean);
    for (const commit of history) {
      let previous;
      try { previous = git(cwd, 'rev-parse', '--verify', `${commit}:${file}`); }
      catch { continue; } // The file may not exist before a rename or creation.
      if (previous === proposed) throw new Error(`Publish blocked: ${file} was replaced with an older published version (${commit.slice(0, 8)}). Review the change instead of copying an outdated page.`);
    }
  }
  return checkSite(cwd, local);
}
