# WSL Git Commands for Multi-Root Workspace

## Overview

When working with this multi-root workspace on Windows with WSL (Windows Subsystem for Linux), git commands require special handling due to path resolution issues.

---

## The Problem

The workspace has three root folders:
- `c:\Users\lleeo\Documents\GitHub\easy-csp-shared-types`
- `c:\Users\lleeo\Documents\GitHub\easy-csp-cloud`
- `c:\Users\lleeo\Documents\GitHub\easy-csp`

When using the `executePwsh` tool with the `cwd` parameter, the system cannot resolve Windows paths (`c:\...`) or WSL paths (`/mnt/c/...`) correctly in the bash shell environment.

---

## The Solution

Use `bash -c` to wrap git commands and change directory within the bash context:

```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git <command>"
```

### Key Points

1. **Use WSL path format**: `/mnt/c/Users/lleeo/Documents/GitHub/easy-csp`
   - NOT Windows format: `c:\Users\lleeo\Documents\GitHub\easy-csp`
   - NOT relative: `easy-csp`

2. **Wrap in `bash -c`**: This executes the command in a bash subshell where the cd command works properly

3. **Chain with `&&`**: Ensures the git command only runs if cd succeeds

---

## Common Git Commands

### Check Status
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git status"
```

### Add All Changes
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git add -A"
```

### Commit
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git commit -m 'Your commit message'"
```

### Push
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git push"
```

### Pull
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git pull"
```

### View Log
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git log --oneline -5"
```

### Create Branch
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git checkout -b feature-branch"
```

### Switch Branch
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git checkout main"
```

---

## For Other Workspace Folders

### easy-csp-shared-types
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp-shared-types && git <command>"
```

### easy-csp-cloud
```bash
bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp-cloud && git <command>"
```

---

## Why This Works

1. **bash -c** creates a new bash shell instance
2. The **cd** command works properly within this bash context
3. The **WSL path** (`/mnt/c/...`) is recognized by bash
4. The **&&** operator ensures git only runs if cd succeeds
5. The entire command string is executed in the correct directory

---

## What Doesn't Work

❌ **Using cwd parameter with Windows path:**
```bash
# This fails
executePwsh(command: "git status", cwd: "c:\\Users\\lleeo\\Documents\\GitHub\\easy-csp")
```

❌ **Using cwd parameter with WSL path:**
```bash
# This also fails
executePwsh(command: "git status", cwd: "/mnt/c/Users/lleeo/Documents/GitHub/easy-csp")
```

❌ **Using cd command directly:**
```bash
# This is not allowed by the tool
executePwsh(command: "cd /mnt/c/... && git status")
```

✅ **Using bash -c wrapper:**
```bash
# This works!
executePwsh(command: 'bash -c "cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp && git status"')
```

---

## Error Messages to Ignore

When running these commands, you may see:
```
-bash: cd: c:\Users\lleeo\Documents\GitHub\easy-csp: No such file or directory
```

This error can be ignored - it's from the system trying to cd with the Windows path before bash -c executes. The actual git command still runs successfully in the bash subshell.

---

## Quick Reference

| Task | Command |
|------|---------|
| Status | `bash -c "cd /mnt/c/.../easy-csp && git status"` |
| Add all | `bash -c "cd /mnt/c/.../easy-csp && git add -A"` |
| Commit | `bash -c "cd /mnt/c/.../easy-csp && git commit -m 'msg'"` |
| Push | `bash -c "cd /mnt/c/.../easy-csp && git push"` |
| Pull | `bash -c "cd /mnt/c/.../easy-csp && git pull"` |

Replace `/mnt/c/.../easy-csp` with the full path to the repository you're working with.
