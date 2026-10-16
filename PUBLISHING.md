# Website publishing checks

Install the local publishing hook once per clone:

```sh
chmod +x .githooks/pre-push
git config core.hooksPath .githooks
```

Before preparing changes, fetch origin and start from the latest `origin/main`.
Use a separate worktree if the current checkout has unrelated edits. Apply only
the intended content changes; never copy whole outdated pages over newer pages.

Before publishing a committed change:

```sh
node --test scripts/site-safety.test.mjs
node scripts/check-site.mjs --ref HEAD
git diff origin/main..HEAD
git push origin HEAD:main
```

The hook checks the actual commit being pushed, not unsaved local files. It:

- Checks every HTML footer against `scripts/footer-links.json`, including social links.
- Checks that Community Partners is under Community and local destinations exist.
- Refuses publishing from an outdated branch, force pushes, or branch deletion.
- Refuses file deletions and exact restoration of an older file version from its last 30 published changes.
- Stops if the remote cannot be checked or changes during the check. Git also rejects a normal push if it changes afterward.

Intentional file removals or rollbacks need a separate, explicit review; do not
disable the hook to get around an unexpected failure. If footer navigation
changes intentionally, update its manifest and all pages together.

GitHub runs the footer checks and regression tests on pushes and pull requests.
The Pages deployment job depends on those checks passing, so a failing check
leaves the previously published site live. Pages must use GitHub Actions as its
deployment source; do not switch it back to branch-based publishing, which
bypasses this gate. The local hook also blocks ordinary unsafe pushes before
they reach GitHub; other clones must install it too.

These checks catch missing links, stale branches, deletions, and exact older-file
restorations. They cannot determine whether every prose edit is intentional;
review the outgoing diff and verify the cache-busted live pages after publishing.
