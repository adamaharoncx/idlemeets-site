import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkPublish, checkSite, footerErrors, git } from './site-safety.mjs';

const expected = JSON.parse(readFileSync(new URL('./footer-links.json', import.meta.url), 'utf8'));
const footer = '<footer><p class="footer-group-label">Community</p>\n<ul>\n'
  + expected.map(({ href, label }) => `              <li><a href="${href}">${label}</a></li>\n`).join('')
  + '</ul></footer>';
const partner = '              <li><a href="/partners/">Community Partners</a></li>\n';

function fixture(t) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'idle-site-safety-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, 'init', '--initial-branch=main');
  git(cwd, 'config', 'user.name', 'Website Safety Test');
  git(cwd, 'config', 'user.email', 'test@example.invalid');
  git(cwd, 'config', 'core.hooksPath', '/dev/null');
  const put = (file, content) => { mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true }); writeFileSync(path.join(cwd, file), content); };
  const commit = () => { git(cwd, 'add', '--all'); git(cwd, 'commit', '-m', 'Test fixture'); return git(cwd, 'rev-parse', 'HEAD'); };
  put('index.html', footer);
  for (const { href } of expected) if (href.startsWith('/')) put(href.slice(1) + 'index.html', footer);
  const base = commit();
  return { cwd, put, commit, base };
}

test('the complete current footer passes', () => {
  assert.deepEqual(footerErrors(footer, expected), []);
});

test('missing, duplicated, relabeled, or misdirected links fail', () => {
  for (const changed of [footer.replace(partner, ''), footer.replace(partner, partner + partner), footer.replace('>Community Partners<', '>Partners<'), footer.replace('href="/partners/"', 'href="/missing/"')]) {
    assert.ok(footerErrors(changed, expected).length);
  }
});

test('a missing footer or moving Partners out of Community fails', () => {
  assert.ok(footerErrors('', expected).length);
  assert.ok(footerErrors(footer.replace('>Community</p>', '>Other</p>'), expected).length);
});

test('removing a link from every page cannot redefine the expected footer', (t) => {
  const f = fixture(t);
  for (const file of git(f.cwd, 'ls-files').split('\n')) f.put(file, footer.replace(partner, ''));
  f.commit();
  assert.throws(() => checkSite(f.cwd), /Community Partners/);
});

test('a normal content update retains recent changes and passes', (t) => {
  const f = fixture(t);
  f.put('index.html', '<p>New release content.</p>' + footer);
  const proposed = f.commit();
  assert.ok(checkPublish(f.cwd, proposed, f.base) > 0);
});

test('an outdated branch and branch deletion are blocked', (t) => {
  const f = fixture(t);
  f.put('index.html', '<p>Recent remote update.</p>' + footer);
  const remote = f.commit();
  assert.throws(() => checkPublish(f.cwd, f.base, remote), /latest published changes/);
  assert.throws(() => checkPublish(f.cwd, '0'.repeat(40), remote), /Deleting/);
});

test('restoring a historical page after a newer update is blocked', (t) => {
  const f = fixture(t);
  f.put('index.html', '<p>Recent content must stay.</p>' + footer);
  const remote = f.commit();
  f.put('index.html', footer);
  const proposed = f.commit();
  assert.throws(() => checkPublish(f.cwd, proposed, remote), /older published version/);
});

test('deleted pages and missing destinations are blocked', (t) => {
  const f = fixture(t);
  rmSync(path.join(f.cwd, 'partners/index.html'));
  const proposed = f.commit();
  assert.throws(() => checkPublish(f.cwd, proposed, f.base), /would be deleted/);
  assert.throws(() => checkSite(f.cwd), /destination is missing/);
});

test('pre-push checks the current remote rather than a stale advertised SHA', (t) => {
  const f = fixture(t);
  const remote = path.join(f.cwd, 'remote.git');
  git(f.cwd, 'init', '--bare', remote);
  git(f.cwd, 'push', remote, 'HEAD:main');
  f.put('index.html', '<p>New published content.</p>' + footer);
  const newer = f.commit();
  git(f.cwd, 'push', remote, 'HEAD:main');
  assert.throws(() => execFileSync(process.execPath, [new URL('./pre-push.mjs', import.meta.url).pathname, 'origin', remote], {
    cwd: f.cwd,
    input: `refs/heads/main ${newer} refs/heads/main ${f.base}\n`,
    stdio: ['pipe', 'pipe', 'pipe'],
  }), (error) => error.status === 1 && error.stderr.toString().includes('live branch changed'));
});
