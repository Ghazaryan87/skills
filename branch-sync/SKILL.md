---
name: branch-sync
description: Use when creating a new branch off a base branch, before pushing a branch, or when a branch has been worked on for a while without checking — offers to pull the base branch from remote and merge it into the working branch so it doesn't drift. Never runs the merge without asking first.
---

# Branch sync

Working branches quietly fall behind their base (`main` or `dev`) while work is
in progress, and that surfaces late — as a messy PR diff or a conflict at merge
time. This skill keeps that from happening by remembering each branch's base
and proactively offering to sync, without ever doing it silently.

This skill only ever **offers**. It never checks out a branch, pulls, or
merges without the user's explicit go-ahead in that moment — that go-ahead is
itself the explicit ask that any push or merge needs. It never pushes
or commits new work of its own; the only commit it produces is the merge
commit the user asked for.

## 1. When a new branch is created off a base

Right after `git checkout -b <new-branch>` (or `git branch <new-branch>`) from
some starting branch, record the base so later checks don't have to guess it:

```
git config branch.<new-branch>.basebranch <base-branch>
```

If a branch already exists without this recorded (e.g. it predates this
skill), infer the base once by checking which of `main`/`dev`/the branch it
was likely forked from contains the merge-base, ask the user to confirm which
one is the real base, then record it the same way.

## 2. Before anything else: look up the recorded base — never assume `main`

Every step below refers to "the base branch." That is never an assumption,
never a default, and never "`main` unless told otherwise" — it is whatever
this exact command returns:

```
git config branch.<current-branch>.basebranch
```

Run this first, every time, before any fetch/checkout/merge in this skill —
including a resync mid-session on a branch already worked on earlier in the
same conversation. A branch's base does not change between turns; skipping
the lookup because "we already know it's main" is exactly the mistake this
step exists to prevent — the recorded value is the one source of truth, not
memory of an earlier turn, and not the most common base in this repo. Chained
feature branches are normal here (a branch built on another feature branch,
itself built on another), so `main` is often *not* the answer even when it
looks like the obvious default.

If the command prints nothing (unset), do not fall back to `main` either:
run the one-time inference in section 1 (check which of `main`/`dev`/the
likely parent actually contains the merge-base, ask the user to confirm),
record it, then proceed. Only after this lookup (or inference) has produced
an actual branch name should `git fetch`/`checkout`/`merge` ever run.

## 3. When to offer a sync

Check before these moments — don't wait to be asked:

- **Right before a push** the user has explicitly requested (this skill never
  initiates a push itself).
- **When resuming work on a branch** that hasn't been touched in a while —
  e.g. its last commit is more than a couple of days old, or several commits
  have landed on the base since.

Do the check:

```
git fetch origin <base-branch>
git rev-list --count HEAD..origin/<base-branch>
```

If that count is 0, the branch is already current — say nothing, or a single
line confirming it's up to date if the user asked directly. If it's greater
than 0, offer the sync (see below); don't perform it unprompted.

## 4. The sync workflow, once the user agrees

1. `git status` — if there are uncommitted changes, stop and ask the user to
   commit or stash them first (per the standing safety rule; never stash or
   discard on your own).
2. `git checkout <base-branch>`
3. `git pull origin <base-branch>` (fast-forward only; if it isn't a
   fast-forward, stop and surface that rather than forcing anything).
4. `git checkout <working-branch>`
5. `git merge <base-branch>` — if it merges cleanly, report the result
   (fast-forward vs. merge commit, files touched). If there are conflicts,
   stop, list the conflicting files, and let the user resolve them; don't
   attempt automatic conflict resolution or `--abort` on your own initiative.

## What this skill does not do

- Does not push the working branch or the base branch anywhere.
- Does not commit unrelated in-progress work to make the merge possible.
- Does not rebase — merge only, since rebasing rewrites history the user may
  have already shared.
- Does not run on `main`, `dev`, or other branches that aren't someone's
  working branch.
