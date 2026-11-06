# show-on-screen — install

A Claude Code skill. Claude opens the real screens of your web app in a Chrome
window you can see, puts a red outline on each element it's talking about, takes a
screenshot of every step, and reports one case at a time.

## Requirements
- Claude Code (CLI, desktop app or IDE extension)
- Node.js 18 or newer (`node -v`)
- Google Chrome installed in the usual place (the driver runs your Chrome, so
  Playwright doesn't download a browser)
- A web app you can open locally (for example http://localhost:5173)

## Install (for you, in every project) — recommended
```bash
mkdir -p ~/.claude/skills
unzip show-on-screen.zip -d ~/.claude/skills/
```
This gives you `~/.claude/skills/show-on-screen/SKILL.md` and `scripts/driver.mjs`.

## Install (for one project only, shared with the team through git)
```bash
mkdir -p .claude/skills
unzip show-on-screen.zip -d .claude/skills/
```
Then, in `.claude/skills/show-on-screen/SKILL.md`, change the line
`cp ~/.claude/skills/show-on-screen/scripts/driver.mjs .`
to point at the project copy: `cp <project>/.claude/skills/show-on-screen/scripts/driver.mjs .`

## Use it
1. Start a new Claude Code session; skills are loaded when a session starts.
   Check it's there: type `/` and look for `show-on-screen`.
2. Start your app locally.
3. Ask for it: "show me the bugs in TICKET-123 on screen", "walk me through the
   checkout flow point by point", or run `/show-on-screen <what to show>`.
4. The first time, Claude installs Playwright in its scratch folder (`npm i playwright`)
   and asks you to allow running `node`. Allow it.

## Make it work well
- **Sign-in:** put the demo or test logins in the project's CLAUDE.md (or point to the
  env file they come from). The skill never guesses a password.
- **Screenshots:** they go in a git-ignored folder, `docs-local/screenshots/` by
  default. Add `docs-local/` to `.gitignore`, or tell Claude which folder to use.
- **Shared servers:** the skill uses the local app. It opens dev, staging or prod
  only when you say so, and there it only signs in and looks.
- **Window:** it stays open, one labelled tab per step. Close it yourself, or tell
  Claude you're done.

## Files
- `SKILL.md`: the instructions Claude follows
- `scripts/driver.mjs`: the Playwright script behind the visible window
  (`node driver.mjs <start-url> <work-dir>`)
