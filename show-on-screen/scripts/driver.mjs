// A visible browser window that Claude drives step by step, so the user
// watches every screen it opens.
//
//   node driver.mjs <start-url> [work-dir]
//
// Each step is a JavaScript file written to <work-dir>/cmd.js. The driver runs
// it as the body of an async function and writes what it returns to
// <work-dir>/out.txt, ending with a line "DONE". Inside a step:
//   page     the first tab       ctx, browser   its context and browser
//   mark(locator, label?)       red outline (and optional red tag) on an element
//   unmark(p?)                  clear every mark (on tab p, default the first)
//   shot(name, p?)              screenshot of tab p to <work-dir>/<name>.png
//   tab(label)                  open a new tab in the same window, named label
//   name(p, label)              (re)name a tab: "label" shows in the tab strip
//   globalThis                  survives between steps
//
// Uses the installed Google Chrome (channel "chrome"), so no browser download.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const START = process.argv[2] ?? "about:blank";
const DIR = path.resolve(process.argv[3] ?? ".");
const CMD = path.join(DIR, "cmd.js");
const OUT = path.join(DIR, "out.txt");

const browser = await chromium.launch({
  channel: "chrome",
  headless: false,
  args: ["--window-size=1440,900"],
});
const ctx = await browser.newContext({ viewport: null });
const page = await ctx.newPage();
await page.goto(START).catch(() => {});

const RED = "#d33";

async function mark(locator, label) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.evaluate(
    (el, [red, text]) => {
      el.dataset.showOnScreen = "1";
      el.style.outline = `3px solid ${red}`;
      el.style.outlineOffset = "2px";
      if (text) {
        const tag = document.createElement("div");
        tag.dataset.showOnScreenTag = "1";
        tag.textContent = text;
        const box = el.getBoundingClientRect();
        Object.assign(tag.style, {
          position: "fixed",
          left: `${Math.max(4, box.left)}px`,
          top: `${Math.max(4, box.top - 26)}px`,
          background: red,
          color: "#fff",
          font: "600 12px/1.6 system-ui, sans-serif",
          padding: "0 8px",
          borderRadius: "4px",
          zIndex: 2147483647,
          pointerEvents: "none",
        });
        document.body.appendChild(tag);
      }
    },
    [RED, label ?? ""],
  );
}

async function unmark(p = page) {
  await p.evaluate(() => {
    for (const el of document.querySelectorAll("[data-show-on-screen]")) {
      el.style.outline = "";
      el.style.outlineOffset = "";
      delete el.dataset.showOnScreen;
    }
    for (const tag of document.querySelectorAll("[data-show-on-screen-tag]")) tag.remove();
  });
}

async function shot(name, p = page) {
  const file = path.join(DIR, `${name}.png`);
  await p.screenshot({ path: file });
  return file;
}

// Keeps "label — <the app's own title>" in the tab strip, even when the app
// changes its title on navigation, so the user can tell the steps apart. A
// title that already starts with the label is left alone, so setting it never
// re-triggers itself (whatever characters the label contains).
async function name(p, label) {
  await p.evaluate((l) => {
    window.__showOnScreenLabel = l;
    const apply = () => {
      const prefix = `${window.__showOnScreenLabel} — `;
      if (document.title.startsWith(prefix)) return;
      const base = window.__showOnScreenBase && document.title.startsWith(window.__showOnScreenBase)
        ? window.__showOnScreenBase
        : document.title.replace(/^.* — /, "");
      window.__showOnScreenBase = base;
      document.title = prefix + base;
    };
    apply();
    if (!window.__showOnScreenTitleObserver) {
      const head = document.querySelector("title") ?? document.head;
      window.__showOnScreenTitleObserver = new MutationObserver(apply);
      window.__showOnScreenTitleObserver.observe(head, { childList: true, subtree: true, characterData: true });
    }
  }, label);
}

// One tab per step: a new tab in the same window (same cookies). An app that
// keeps its session in memory lands the new tab on sign-in; sign in there.
async function tab(label) {
  const p = await ctx.newPage();
  p.on("load", () => name(p, label).catch(() => {}));
  return p;
}

fs.writeFileSync(OUT, "READY\nDONE\n");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
for (;;) {
  if (fs.existsSync(CMD)) {
    const code = fs.readFileSync(CMD, "utf8");
    fs.unlinkSync(CMD);
    let out;
    try {
      out = await new AsyncFunction(
        "page", "ctx", "browser", "mark", "unmark", "shot", "tab", "name", code,
      )(page, ctx, browser, mark, unmark, shot, tab, name);
    } catch (e) {
      out = "ERROR " + String(e?.message ?? e).split("\n")[0];
    }
    fs.writeFileSync(OUT, String(out ?? "done") + "\nDONE\n");
  }
  if (!browser.isConnected()) process.exit(0);
  await new Promise((r) => setTimeout(r, 300));
}
