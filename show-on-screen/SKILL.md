---
name: show-on-screen
description: Use whenever the user wants to SEE something in the running app — a bug, a fix, a ticket's issues, a flow, a status, a difference between two versions — or asks "show me", "open the screen", "where can I see", "walk me through", "point by point". Opens the real screens in a visible browser window, outlines every relevant element in red, screenshots each step, and reports one case at a time as Screen · The bug · How it should work · Status. Works in any project with a web UI.
---

# Show it on screen

The user wants to watch, not read. For every case, open the exact screen, put a red
outline on the exact row, button, card or message, and explain it next to its
screenshot. One case at a time, in the same order every time.

## 1. Before opening anything

- **List the cases** first: each bug, fix or step the user asked about, numbered.
- **Find the real record for each case** (a row, a request number, a team, a person)
  by reading the database or API, so each screen shows actual data, not an empty page.
  Name the record in the report ("ORD-0073, Jane Doe").
- **Know how to sign in.** Take the login from the project's memory or CLAUDE.md
  (demo seats, env passwords). Never guess a password: login is often rate-limited.
  Pick the role the case is about (for an admin "team view" or role switcher, switch it).
- **Local first.** Use the local app. Open a shared or deployed server (dev, staging,
  prod) only when the user explicitly asks, and there do nothing beyond signing in
  and looking: no presses, no saves, no setting changes. Say afterwards exactly what
  was done there.

## 2. Start the window

The driver is `scripts/driver.mjs` in this skill's folder. Copy it into a scratch
directory that has Playwright and run it there (ESM resolves `playwright` next to the
script, so it must not run from the skill folder). It uses the installed Google
Chrome, no browser download:

```bash
mkdir -p <scratchpad>/show && cd <scratchpad>/show
[ -d node_modules/playwright ] || { npm init -y >/dev/null; npm i --silent playwright; }
cp ~/.claude/skills/show-on-screen/scripts/driver.mjs .
node driver.mjs http://localhost:5173 .   # run in background (run_in_background)
```

Each step: empty `out.txt`, write the step to `cmd.tmp` and **rename** it to `cmd.js`
(the driver polls every 300 ms and would otherwise run a half-written file), then wait
for `DONE`:

```bash
: > out.txt && cat > cmd.tmp <<'EOF'
await page.goto("http://localhost:5173/some/screen");
await page.waitForTimeout(2000);
const row = page.locator("tbody tr:visible", { hasText: "ORD-0073" }).first();
await mark(row, "Same item listed twice");
await shot("1a-duplicate-row");
return (await row.innerText()).replace(/\s+/g, " ");
EOF
mv cmd.tmp cmd.js && until grep -q DONE out.txt; do sleep 1; done; cat out.txt
```

- **One tab per step.** Open each case or step in its own tab (`tab("1 · Cart")`),
  and give a step that spans several screens one tab per screen (`"3a · Checkout address"`,
  `"3b · Checkout payment"`). Leave every tab open, marked, in order, so the user can click
  through them after the report; `name()` keeps the label in the tab strip. Mark and
  screenshot each tab (`shot("3b-payment", p3b)`), and keep the tabs in `globalThis`.
- An app that keeps its session in memory lands a new tab on its sign-in page: sign in
  in each tab (mind the login rate limit), or open the tabs from one signed-in tab only
  when the app shares its session across tabs.
- Keep the window open between steps (state lives in `globalThis`). If the user closed
  it, the driver exits; start it again and sign in again.
- `mark()` scrolls the element into view. Call `unmark()` before marking the next case.
- Prefer `button:visible` / `tbody tr:visible` locators; hidden duplicates are common.
- **Look at every screenshot (Read the PNG) before describing it.** A blank page,
  a spinner, or the wrong team view is a failed step, not evidence.

## 3. Do not change data to make a point

- Viewing is free. A press that writes (Approve, Send, Accept, Add, Delete) is not:
  only press it when the user asked, or when it is the demonstration itself and will
  be refused (showing a guard). Afterwards check the database to confirm nothing was
  written, and say so.
- If showing a case needs a write, leave the window parked on that screen and tell the
  user which button to press and what they should see.
- Never revert source code to "show the bug". Show the fixed screen, and describe what
  the broken one did (with an old screenshot if one exists).
- Note every demo record created so it can be cleaned up later.

## 4. Report, one case at a time

For each case, in this order and with these headings:

```
### <n>. <one-line name of the case>
**Screen:** <menu path> — tab "<n · label>" (<screenshot file>)
- **The bug:** what went wrong, in the user's terms, naming the real record.
- **How it should work:** the rule, citing the spec section / requirement / ticket.
- **Status:** fixed · partly fixed · still open · not committed yet — plus the evidence
  seen on this screen (the red-outlined element) and how the user can try it.
```

- Lead with the overall answer in one or two sentences before case 1.
- If a case is only partly fixed (the server refuses but a screen still offers the
  button), say so plainly and propose the follow-up; never round it up to "fixed".
- End with what is still open and the decisions the user has to make.

## 5. Keep the screenshots local

- Copy the screenshots into a git-ignored folder of the project (for example
  `docs-local/screenshots/<date>-<topic>/`, numbered by case) and confirm with
  `git check-ignore <file>` before saying they are saved. If the project has no
  ignored folder, keep them in the scratchpad and say where.
- Never `git add` them.

## 6. When done

Leave the window open with one marked tab per step, and list the tabs in the report
(tab label → what it shows), naming the one that is in front. Close it when the
user moves on (`await browser.close()` in a step); never press Sign out on a shared
server, just close the window.
