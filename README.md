# Getting Started with opencode — Agents, Commands & Skills

A hands-on, beginner-friendly demo repository that teaches the **building blocks of [opencode](https://opencode.ai)** through two small, fully deterministic examples.

If you've never touched opencode before, this is the right place to start. Nothing here "does anything useful" on purpose — the **structure is fixed and the data flow is deterministic** so that the **mechanics stay visible** instead of being hidden behind generated text. (The one genuinely generative bit is step 2 of Demo 2, which writes a short fact per item to show a real loop.)

---

## 1. The mental model: 4 building blocks

opencode lets you customize how the AI works using four kinds of files. The single most important idea in this repo is that **each block answers a different question**:

| Block | Answers… | What it is | Lives in | Docs |
|---|---|---|---|---|
| **Command** | **WHAT** | A reusable *workflow* / scenario you trigger with `/name` | `.opencode/commands/` | [↗](https://opencode.ai/docs/commands/) |
| **Agent** | **WHO** | A *personality*: language, tone, model, permissions | `.opencode/agents/` | [↗](https://opencode.ai/docs/agents/) |
| **Skill** | **HOW** | A *one-off capability* loaded on demand (here: output format) | `.opencode/skills/` | [↗](https://opencode.ai/docs/skills/) |
| **Plugin** | **OBSERVABILITY** | TypeScript *hooks* that watch and log what happens | `.opencode/plugins/` | [↗](https://opencode.ai/docs/plugins/) |

> 🧠 **Keep this separation in your head.** A command describes *what to produce*. An agent decides *who produces it*. A skill changes *how* the result looks. A plugin just *watches*. The whole point of the two demos below is to show that you can mix and match these blocks instead of duplicating code.

---

## 2. What is the `.opencode/` directory?

When opencode starts in a project, it automatically discovers everything inside `.opencode/`. You don't import or register these files manually — **the folder name is the convention**.

```
.opencode/
├── agents/                 ← WHO: personalities (language, model, permissions)
│   ├── demo-greeter.md
│   ├── demo-looper.md
│   ├── demo-farewell.md
│   ├── demo-english.md     ← speaks English, may use the demo-yaml skill
│   └── demo-chtimi.md      ← speaks "ch'ti" (a French dialect), may use demo-json
│
├── commands/               ← WHAT: workflows you trigger with /name
│   ├── demo-presenter.md   ← Demo 1 (a single command)
│   └── demo/               ← Demo 2 (a pipeline of commands)
│       ├── demo_orchestrate.md
│       ├── demo_greet.md
│       ├── demo_loop.md
│       ├── demo_farewell.md
│       └── README.md
│
├── skills/                 ← HOW: capabilities loaded on demand
│   ├── demo-yaml/SKILL.md  ← "format the output as YAML"
│   └── demo-json/SKILL.md  ← "format the output as JSON"
│
└── plugins/
    └── demo-logger.ts      ← OBSERVABILITY: logs only demo events
```

### Anatomy of each file

Every agent, command and skill is just a **Markdown file with a YAML frontmatter** (the part between the `---` lines). The frontmatter configures the block; the Markdown body is the prompt/instructions.

**A command** (`commands/*.md`):
```markdown
---
description: what this command does          # shown in the /command picker
agent: demo-greeter                          # WHO runs this workflow
---
# The workflow
Instructions, variables, steps, expected report…
```

**An agent** (`agents/*.md`):
```markdown
---
description: a short summary of the personality
mode: primary        # or "subagent" (see below)
model: github-copilot/claude-sonnet-4.6
permission:          # what this agent is allowed to do
  edit: allow
  bash: allow
  webfetch: deny
  skill:
    demo-yaml: allow # which skills this agent may use
---
You are an agent specialized in…             # the system prompt
```

**A skill** (`skills/<name>/SKILL.md`):
```markdown
---
name: demo-yaml
description: Format the final output as YAML. Use proactively when…
---
# Instructions the model follows when this skill is active
```

> 💡 **`mode: primary` vs `mode: subagent`**
> - **primary** = an agent you can talk to directly and switch with **Tab** in the opencode UI.
> - **subagent** = a specialist that doesn't chat with you; it's invoked *by a command or by another agent* (via the `task` tool) to do one job. The pipeline in Demo 2 uses subagents.

---

## 3. Demo 1 — `/demo-presenter`: how the blocks **combine**

> **One command. One workflow. But the result changes depending on the agent (language/tone/model) and the skill (format).** This is separation of concerns in action.

### The files involved

| Block | File | Its role here |
|---|---|---|
| **Command** | `commands/demo-presenter.md` | Defines the *card schema*: exactly 4 fields (`name`, `habitat`, `diet`, `fun_facts`). Says **nothing** about language or format. |
| **Agent** | `agents/demo-chtimi.md` & `demo-english.md` | Define the **language + tone + model**, and **allow one skill** each (`demo-json` for ch'ti, `demo-yaml` for English). |
| **Skill** | `skills/demo-json/SKILL.md` & `demo-yaml/SKILL.md` | Define **only the output format**. |

### What the command says (the WHAT)

`demo-presenter.md` asks for a "presentation card" about an animal passed as an argument, with **exactly 4 fields** and a guardrail: if you give no animal, it stops and asks for one. Crucially, it never mentions a language or a format — that's not its job.

### Try it

```bash
# The command's frontmatter pins agent: demo-chtimi
/demo-presenter chat
```
→ Output is **in ch'ti + JSON**, because the `demo-chtimi` agent speaks ch'ti and is allowed to use the `demo-json` skill.

Now change **one line** in `commands/demo-presenter.md`:
```diff
- agent: demo-chtimi
+ agent: demo-english
```
and run the same command again:
```bash
/demo-presenter chat
```
→ Output is now **in English + YAML**. You didn't touch the workflow — you only changed **WHO** runs it, and both the language *and* the format changed.

Finally, trigger the guardrail:
```bash
/demo-presenter         # no argument
```
→ The command stops and asks you to provide an animal. **Robustness lives in the command, not in the agent.**

### The takeaway

> **1 command × 2 agents × 2 skills = 4 possible behaviors, with zero rewriting of the workflow.** Reusability means *combining blocks* instead of duplicating code.

> 💡 Because both agents are `mode: primary`, you can also switch them with **Tab** in the UI instead of editing the frontmatter.

---

## 4. Demo 2 — `/demo_orchestrate`: command **types** & orchestration

> **Commands come in levels** (a simple workflow → a loop → an orchestrator), and **an orchestrator never rewrites its sub-steps — it chains them.** Data flows **through files**, so everything is visible on disk.

This demo lives entirely in `.opencode/commands/demo/` (it has [its own detailed README there](.opencode/commands/demo/README.md)).

### The levels

| Level | Concept | File |
|---|---|---|
| **L2** | Simple workflow | `demo_greet.md`, `demo_farewell.md` |
| **L3** | Control flow + **loop** | `demo_loop.md` (the `<demo-loop>` block, even/odd branch) |
| **L4** | **Orchestration / delegation** | `demo_orchestrate.md` (3 sequential `task` calls) |

> These three levels (L2–L4) are a slice of a full **7-level ladder** of slash commands — see [section 5](#5-commands-come-in-levels--a-structured-way-to-build-them) below.

### The pipeline

```
/demo_orchestrate 3
       │
       ▼   creates demo_outputs/<timestamp>/   (the orchestrator)
┌─────────────────────────────────────────────────────────────┐
│ Step 1 — /demo_greet      agent: demo-greeter                │
│   picks a static topic   →  writes  topic.txt                │
└─────────────────────────────────────────────────────────────┘
       │  the orchestrator passes the same directory to the next step
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2 — /demo_loop       agent: demo-looper      (L3 loop)  │
│   reads topic.txt        →  writes items/item_1..N.txt       │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3 — /demo_farewell   agent: demo-farewell               │
│   reads all items/*.txt  →  writes summary.md                │
└─────────────────────────────────────────────────────────────┘
       │
       ▼   the orchestrator reports the 3 results + the directory path
```

### The three things this demo proves

1. **Each step is its own command + its own agent.** `demo_greet` → `demo-greeter`, `demo_loop` → `demo-looper`, `demo_farewell` → `demo-farewell`. Each agent is a `subagent`: a focused specialist.

2. **The orchestrator is just a conductor.** Look at `demo_orchestrate.md`: each step is a *one-liner* `task` call like `"Run /demo_greet <OUTPUT_DIR>"`. The orchestrator **never copies** the sub-workflow's content. The sub-command file stays the **single source of truth**. The order is **strictly sequential** — each step waits for the previous one to finish.

3. **Data passes through files, not return values.** Why? It's *visible* (`ls demo_outputs/...` shows exactly what each step produced), each step is *independently testable* (just pre-create its input file), and the loop in step 2 is *traceable* (it logs `even`/`odd` per iteration).

### Zoom on the L3 loop (`demo_loop.md`)

Step 2 is the only step with real control flow. Its workflow contains a `<demo-loop>` block that runs `COUNT` times; on each iteration it writes one `item_<i>.txt` and prints a **different message depending on whether `i` is even or odd**. That's the pedagogical heart of "control flow" — a visible branch on every pass.

### Run it

```bash
# Full pipeline (COUNT = number of items step 2 generates; default 3)
/demo_orchestrate 3

# Inspect the file-based data flow
ls -R demo_outputs/        # find your timestamped folder
cat demo_outputs/<timestamp>/summary.md
```

Each step can also run **in isolation**, as long as its input exists:
```bash
/demo_greet    demo_outputs/test        # step 1 → topic.txt
/demo_loop     demo_outputs/test 5      # step 2 → needs topic.txt
/demo_farewell demo_outputs/test        # step 3 → needs items/
```

### The takeaway

> A command can be a **simple workflow**, a **loop**, or a **conductor**. And a conductor doesn't play the instruments — it triggers the musicians in the right order and passes the scores (the files) between them.

---

## 5. Commands come in levels — a structured way to build them

You don't write commands ad hoc. A slash command is **assembled from a fixed set of sections**, and commands form a **ladder of 7 levels**, from a one-shot static prompt to a self-improving expert system. Each higher level *builds on* the lower ones — a Level 7 command still contains a Level 2 workflow inside it.

> 📘 The full guide, with one real example per level from this repo, lives in **[`.opencode/commands/COMMAND_LEVELS.md`](.opencode/commands/COMMAND_LEVELS.md)**. This section is the summary.

### The 7 levels

| Level | Name | Defining trait | Example in this repo |
|---|---|---|---|
| **L1** | High Level Prompt | Static, one-shot, no real workflow | `examples/prime.md` |
| **L2** | Workflow Prompt | Variables + strictly sequential steps | `demo/demo_greet.md` |
| **L3** | Control Flow Prompt | Loops and conditionals | `demo/demo_loop.md` |
| **L4** | Delegation Prompt | Spawns subagents via the `task` tool | `examples/parallel_subagents.md` |
| **L5** | Higher Order Prompt | Executes content produced elsewhere (a plan/spec) | `examples/build.md` |
| **L6** | Template Metaprompt | Generates *other* commands from a description | `examples/t_metaprompt_workflow.md` |
| **L7** | Self Improving Prompt | Updates its own `## Expertise` after each run | `examples/experts/oc_plugin_expert/…` |

The two demos above already sit on this ladder: **Demo 1** (`demo-presenter`) is an L2 workflow, and **Demo 2** chains an L2 → L3 → L2 pipeline behind an L4 orchestrator.

### Build commands structurally — the sections

Whatever the level, a command is made of the same named sections. Only the frontmatter and one body instruction are strictly required (L1); every other section is added as the command climbs the ladder:

```markdown
---
description: <short, action-oriented summary>   ← Frontmatter (required)
agent: build                                    ← which agent runs it (model lives on the agent)
---

# Command Title                                 ← Title
One or two sentences on what it does.           ← Purpose

## Variables                                    ← Variables ($1, $2, $ARGUMENTS)
ARG_ONE: $1

## Instructions                                 ← Rules / guardrails (IMPORTANT, STOP if…)
- If <precondition fails>, STOP and ask the user.

## Workflow                                     ← The core steps (numbered)
1. <step one>
2. <step two>

## Report                                       ← How to present the result
Summarize the result as <format>.
```

Higher levels just add sections to this skeleton: L6 adds a **`## Specified Format`** (the template a metaprompt fills in), L7 adds a **`## Expertise`** (a living knowledge base auto-updated after each run).

### Which level do I need?

```
Does it LEARN and improve over time?                    → L7 (Self Improving)
Does it GENERATE another prompt/file from a template?   → L6 (Template Metaprompt)
Does it EXECUTE content produced elsewhere (plan/spec)? → L5 (Higher Order)
Does it DELEGATE work to subagents via `task`?          → L4 (Delegation)
Does it have LOOPS or IF/ELSE in the workflow?          → L3 (Control Flow)
Does it have a structured multi-step WORKFLOW?          → L2 (Workflow)
None of the above (one-shot instruction)?               → L1 (High Level)
```

> 🧱 **Takeaway:** start at the lowest level that does the job, and climb only when you need to. A structured command is easier to read, test, and reuse than a wall of free-form instructions.

---

## 6. The plugin — free observability

`.opencode/plugins/demo-logger.ts` is a small TypeScript plugin. Plugins subscribe to **lifecycle hooks** and react to events. This one:

- hooks into `command.execute.before`, `tool.execute.before/after`, `chat.params`, and the `session.idle` event;
- **filters** to keep *only* demo activity (commands whose name starts with `demo`, files under `demo_outputs/`, etc.);
- for each kept event, appends a JSONL line to `agents/demo_logs/<sessionId>/demo.jsonl` **and** prints a very visible console marker:

```
[demo-logger] demo-greeter   tool.execute.before    ← step 1 task call
[demo-logger] demo-greeter   tool.execute.after     ← topic.txt write
[demo-logger] demo-looper    tool.execute.after     ← item_1.txt write
[demo-logger] demo-farewell  tool.execute.after     ← summary.md write
```

It's **non-blocking** (everything is wrapped in try/catch) — a plugin failure never interrupts opencode. This is how you get a live, narratable trace of a pipeline without changing any of the commands or agents.

> ⚙️ After editing the `plugins/` folder, **restart opencode** so the new plugin is loaded.

---

## 7. Cheat sheet

**Demo 1 — combination**
```bash
/demo-presenter chat        # ch'ti + JSON   (agent demo-chtimi)
# edit  agent: demo-chtimi → demo-english  in demo-presenter.md
/demo-presenter chat        # English + YAML (agent demo-english)
/demo-presenter             # guardrail: asks for an argument
```
→ *1 command × 2 agents × 2 skills = 4 outputs, 0 rewrites.*

**Demo 2 — orchestration**
```bash
/demo_orchestrate 3                       # chains greeter → looper → farewell
ls -R demo_outputs/<timestamp>/           # data passed through files
cat   demo_outputs/<timestamp>/summary.md
```
→ *L2 workflow · L3 loop · L4 orchestrator · plugin = observability · single source of truth.*

---

## 8. Where to go next

- Open `.opencode/commands/demo-presenter.md` and the two agents side by side — see how little each file contains.
- Read [`.opencode/commands/demo/README.md`](.opencode/commands/demo/README.md) for the deep dive on the pipeline.
- Read [`.opencode/commands/COMMAND_LEVELS.md`](.opencode/commands/COMMAND_LEVELS.md) for the full 7-level command ladder, with one example per level.
- Try extending the demo: add a 4th step (copy a command + a subagent, add one `task` call to the orchestrator), or swap the static content for a real LLM/MCP call — **the agent stays the same, only the command's workflow changes.**

### Official opencode documentation

- 🌐 [opencode.ai](https://opencode.ai) — homepage
- 📚 [Docs home](https://opencode.ai/docs/)
- 🧩 [Commands](https://opencode.ai/docs/commands/) — the WHAT
- 🤖 [Agents](https://opencode.ai/docs/agents/) — the WHO
- 🛠️ [Skills](https://opencode.ai/docs/skills/) — the HOW
- 🔌 [Plugins](https://opencode.ai/docs/plugins/) — observability

> 📁 The two examples are intentionally tiny and deterministic. Once the mechanics click, the same four blocks scale up to real workflows.
