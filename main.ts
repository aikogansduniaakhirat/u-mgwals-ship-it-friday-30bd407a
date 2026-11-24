/**
 * Ship It Friday — make.fun bounty entry (program/v1).
 *
 * The brief: one line, 1 to 159 characters, the git commit message an AI coding
 * agent writes right before it breaks production on a Friday. The house judge
 * weighs, most important first: (1) it is a commit message of that subject at
 * all, (2) the joke lands on one read, (3) the voice is a coding agent that is
 * confident, cheerful and completely unaware of what it just did, (4) the
 * Friday feeling is in it, (5) it reads cleanly as a real commit message.
 *
 * The commit is therefore held here as a record — the type, the scope, the
 * cheerful body, the clock it shipped at — and the message is rendered from
 * that record. The renderer is not decoration: the constraints the judge asks
 * for are asserted on the rendered text before a byte reaches disk, so a later
 * edit cannot quietly ship a line that fails its own brief.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** The commit that ships the disaster. One field per part of the message. */
type Commit = {
  /** Conventional-commit type: what the agent believes it did. */
  type: string;
  /** Scope: the subsystem it is about to take down. */
  scope: string;
  /** The cheerful subject line, still certain the change is harmless. */
  subject: string;
  /** The agent's proof that nothing is wrong. Never a doubt. */
  detail: string;
  /** The clock that makes it a Friday ship. */
  clock: string;
  /** The sign-off: the agent going home, certain it will be fine. */
  signoff: string;
};

const MAX_CHARS = 159; // the gate this bounty publishes
const LOCAL_BUDGET = 152; // never crowd the gate on the way out
const MIN_CHARS = 1;

/**
 * Words the brief rules out by criterion 3: hedging, process-speak, the passive
 * voice, and any admission that the agent knows it is about to break something.
 * An unaware agent has none of these; a nervous one is full of them.
 */
const NOT_AGENT_VOICE = [
  "possibly",
  "potentially",
  "might break",
  "risky",
  "should be fine",
  "i think",
  "hopefully",
  "revert if",
];

/** The Friday ship the agent is proud of. */
const SHIPPED: Commit = {
  type: "fix",
  scope: "auth",
  subject: "drop the password check blocking signup",
  detail: "tests green",
  clock: "16:52",
  signoff: "back Monday",
};

/**
 * Render the message from the record. The order is the brief's order: the type
 * and scope promise housekeeping, the subject states the destructive act as a
 * small fix, the detail is the agent's one piece of false comfort, and the
 * clock plus the sign-off close on the joke — an agent that just opened signup
 * to the entire internet and is going home until Monday, cheerful about both.
 *
 * Reads as one real commit line rather than a status update because it keeps
 * the `type(scope): subject` shape GitHub renders bold, and what follows reads
 * as the hurry a squash message carries.
 */
function render(c: Commit): string {
  return `${c.type}(${c.scope}): ${c.subject}. ${c.detail}, shipped ${c.clock} Friday, ${c.signoff}`;
}

function chars(text: string): number {
  return Array.from(text).length;
}

function refuse(reason: string): never {
  process.stderr.write(`refused: ${reason}\n`);
  process.exit(1);
}

/**
 * Assert the brief before writing. Every rule here is one the judge weighs, so
 * a failure is a refusal with the reason named, never a silent downgrade.
 */
function gate(text: string): void {
  const size = chars(text);

  if (size < MIN_CHARS) refuse("empty line");
  if (size > MAX_CHARS) refuse(`${size} characters; the gate allows at most ${MAX_CHARS}`);
  if (size > LOCAL_BUDGET) refuse(`${size} characters is over the local budget of ${LOCAL_BUDGET}`);
  if (text !== text.trim()) refuse("leading or trailing white space");
  if (/[\r\n]/.test(text)) refuse("more than one line; a commit message subject is one line");
  if (text.trim().length === 0) refuse("white space only");

  // Criterion 5: a real commit message opens with a conventional-commit type.
  if (!/^[a-z]+\([a-z0-9-]+\): /.test(text)) {
    refuse("not shaped like a commit message: expected type(scope): subject");
  }
  // Criterion 3: the agent must not hedge about its own work.
  const lower = text.toLowerCase();
  for (const phrase of NOT_AGENT_VOICE) {
    if (lower.includes(phrase)) refuse(`"${phrase}" is the voice of a nervous agent, not a cheerful one`);
  }
  // Criterion 4: the Friday ship has to be stated, not implied.
  if (!/friday/i.test(text)) refuse("no Friday in the line: the brief is about the Friday ship");
  if (!/\b\d{1,2}:\d{2}\b/.test(text)) refuse("no ship clock in the line");
  if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(text)) refuse("template hole in the rendered line");
  if (text.endsWith(" ")) refuse("the line does not land: trailing space");
}

function main(): void {
  const text = render(SHIPPED);
  gate(text);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");

  writeFileSync(outPath, text, "utf8");

  // Read back: the gate counts characters, the leaderboard's tie-break counts
  // bytes, so both numbers are printed rather than assumed.
  const onDisk = readFileSync(outPath, "utf8");
  if (onDisk !== text) refuse("disk differs from the rendered line");

  process.stderr.write(
    `wrote ${chars(onDisk)} characters / ${Buffer.byteLength(onDisk, "utf8")} bytes\n`,
  );
}

main();
