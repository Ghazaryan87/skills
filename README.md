# skills

My [Claude Code](https://claude.com/claude-code) skills, one folder each.

| Skill | What it does |
| --- | --- |
| [show-on-screen](show-on-screen/) | Opens the real screens of a running web app in a visible Chrome window, outlines each relevant element in red, screenshots every step, and reports one case at a time. |
| [branch-sync](branch-sync/) | Remembers each branch's base and offers to merge the latest base into the working branch before a push, so branches don't drift. Never merges without asking. |

## Install

Skills live in `~/.claude/skills/` (for you, in every project) or in
`<project>/.claude/skills/` (for one project, shared through git).

All of them:

```bash
git clone https://github.com/Ghazaryan87/skills.git ~/Developer/skills
mkdir -p ~/.claude/skills
cp -R ~/Developer/skills/show-on-screen ~/Developer/skills/branch-sync ~/.claude/skills/
```

Just one:

```bash
cp -R ~/Developer/skills/show-on-screen ~/.claude/skills/
```

Start a new Claude Code session afterwards, because skills load when a session starts.
Type `/` to check they're listed.

## Requirements

- **show-on-screen:** Node.js 18 or newer and Google Chrome. The first time it runs,
  it installs Playwright in a scratch folder. See
  [show-on-screen/INSTALL.md](show-on-screen/INSTALL.md).
- **branch-sync:** git.
