# Husky Git Hooks Quick Reference

## What Gets Checked

### Pre-commit (Fast - 5s)
- ✅ ESLint (auto-fix)
- ✅ Prettier (auto-format)
- ✅ Staged files only

### Pre-push (Moderate - 30s)
- ✅ Jest test suite
- ✅ All 104 tests
- ✅ Coverage reporting

## Commands

### Normal Workflow
```bash
git add .
git commit -m "feat: add feature"  # ← pre-commit runs
git push                            # ← pre-push runs
```

### Emergency Bypass
```bash
git commit --no-verify -m "hotfix"  # Skip pre-commit
git push --no-verify                # Skip pre-push
```

### Troubleshooting
```bash
# Reinstall hooks
pnpm exec husky install

# Manual lint-staged
npx lint-staged

# Manual test
pnpm test
```

## File Types Checked

| Pattern | Tools |
|---------|-------|
| `*.{ts,tsx,js,jsx}` | ESLint + Prettier |
| `*.{json,md}` | Prettier only |

## Performance

| Hook | Duration | Impact |
|------|----------|--------|
| Pre-commit | ~5s | Minimal |
| Pre-push | ~10-30s | Moderate |

## Common Scenarios

### Formatting Auto-fixed
```bash
$ git commit -m "update"
✔ Preparing lint-staged...
✔ Running tasks for staged files...
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...
[main abc1234] update
```

### Lint Errors
```bash
$ git commit -m "update"
✖ eslint --fix
✖ lint-staged failed
# Fix errors, then commit again
```

### Test Failures
```bash
$ git push
✖ pnpm test
✖ 2 tests failed
# Fix tests, then push again
```

## Configuration Files

| File | Purpose |
|------|---------|
| `.husky/pre-commit` | Runs lint-staged |
| `.husky/pre-push` | Runs tests |
| `package.json` → `lint-staged` | Defines linting rules |
| `package.json` → `prepare` | Auto-installs hooks |

## More Info

See `docs/FEATURE_158_HUSKY_HOOKS.md` for full documentation.
