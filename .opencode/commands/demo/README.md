# Pedagogical Demo of opencode Workflows

A minimal demo that shows, in a single simple scenario, how to wire together the main building blocks of the opencode framework:

- an **orchestrator slash command** that chains 3 sub-steps sequentially
- **3 custom agents**, one per step, each with its own skill
- **file-based data passing** between steps
- a **loop-based workflow** (Level 3 — Control Flow) in the middle of the pipeline
- a **dedicated TypeScript plugin** that logs only demo events

The demo intentionally "does nothing meaningful" — everything is static and deterministic so the mechanics stay visible rather than hidden behind generated content.

---

## Pipeline at a glance

```
/demo_orchestrate <COUNT>
       │
       ▼
  Creates demo_outputs/<timestamp>/   (orchestrator)
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 1 — task → demo-greeter                                   │
│  Slash command: /demo_greet                                     │
│  Agent: demo-greeter (skill = deterministic topic selection)    │
│  Output: demo_outputs/<ts>/topic.txt                            │
└────────────────────────────────────────────────────────────────┘
       │
       ▼   orchestrator passes the path to the next step
┌────────────────────────────────────────────────────────────────┐
│  Step 2 — task → demo-looper                                    │
│  Slash command: /demo_loop                                      │
│  Agent: demo-looper (skill = control-flow loop)                 │
│  Input: reads demo_outputs/<ts>/topic.txt                       │
│  Outputs: demo_outputs/<ts>/items/item_1.txt … item_N.txt       │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 3 — task → demo-farewell                                  │
│  Slash command: /demo_farewell                                  │
│  Agent: demo-farewell (skill = markdown aggregation)            │
│  Input: reads all items/*.txt                                   │
│  Output: demo_outputs/<ts>/summary.md                           │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
  Orchestrator reports the 3 results + the directory path
```

Why pass data **through files** rather than return values:
- **Visibility**: `ls demo_outputs/...` shows exactly what each step produced
- **Isolated testability**: each sub-command can be run standalone (just pre-create the input file)
- **Consistency** with the existing `create_image.md` pattern that writes to `IMAGE_OUTPUT_DIR/<date_time>/`

---

## Demo files

```
.opencode/
├── agents/                                    ← the 3 agent definitions (skills)
│   ├── demo-greeter.md                        ← deterministic topic selection
│   ├── demo-looper.md                         ← control-flow loop
│   └── demo-farewell.md                       ← markdown aggregation
├── commands/demo/                             ← the 4 slash command definitions (workflows)
│   ├── README.md                              ← this file
│   ├── demo_orchestrate.md                    ← sequential orchestrator (Level 4)
│   ├── demo_greet.md                          ← step 1 workflow (Level 2)
│   ├── demo_loop.md                           ← step 2 workflow with <demo-loop> (Level 3)
│   └── demo_farewell.md                       ← step 3 workflow (Level 2)
└── plugins/
    └── demo-logger.ts                         ← dedicated logger, filters demo events
```

### Agent vs slash command — conceptual split

- **Agent** (`.opencode/agents/demo-*.md`) = description of the **behavior/skill**. No mention of slash commands or the `task` tool. Reusable from anywhere.
- **Slash command** (`.opencode/commands/demo/demo_*.md`) = concrete **workflow** (Variables, Instructions, Workflow, Report). Its frontmatter says `agent: demo-xxx` → opencode runs the workflow with the named agent as system prompt.

This split is intentional: the same agent can be invoked via slash command, via the `task` tool, or via `@mention` — it doesn't care, it just performs its skill.

The orchestrator follows the same principle: it **never rewrites** the sub-workflows into its `task` prompts. Each `task` call is a one-liner that invokes the corresponding slash command (e.g. `"Run /demo_greet <OUTPUT_DIR>"`). The slash command file stays the single source of truth.

---

## How to run the demo

### Full pipeline (standard case)

```
/demo_orchestrate 3
```

→ Creates a timestamped directory `demo_outputs/<timestamp>/` containing `topic.txt`, `items/item_1.txt`, `items/item_2.txt`, `items/item_3.txt`, and `summary.md`.

The argument is `COUNT` (number of items the step 2 loop generates). Default: 3.

### Steps in isolation

Each step can run independently, as long as its inputs exist.

```bash
# Step 1 alone — creates demo_outputs/test/topic.txt
/demo_greet demo_outputs/test

# Step 2 alone — requires demo_outputs/test/topic.txt to exist
/demo_loop demo_outputs/test 5

# Step 3 alone — requires demo_outputs/test/items/ to contain files
/demo_farewell demo_outputs/test
```

---

## The `demo-logger` plugin

A TypeScript plugin that subscribes to `message.submit`, `tool.execute.before`, and `tool.execute.after`, and **filters** only what touches the demo:

- user prompts starting with `/demo_`
- `task` calls whose `subagent_type` starts with `demo-`
- file IO under `demo_outputs/` or `.opencode/commands/demo/`

For each filtered event:
- a JSONL line is appended to `agents/demo_logs/<sessionId>/demo.jsonl`
- a `[demo-logger] <step> <event>` marker is printed to the console (very visible during a live demo)

The plugin is non-blocking (global catch) — it never interrupts the opencode flow, like the other plugins in the repo.

Activation: already declared in `opencode.json` → `plugin: [..., "./.opencode/plugins/demo-logger.ts"]`. Restart opencode after editing the `plugin` array so newly added plugins are loaded.

---

## What happens behind the scenes (typical trace)

When you run `/demo_orchestrate 3`, here is the sequence of events the logger emits:

```
[demo-logger] demo_orchestrate message.submit
[demo-logger] demo-greeter   tool.execute.before    ← step 1 task call
[demo-logger] demo-greeter   tool.execute.after     ← topic.txt write
[demo-logger] demo-looper    tool.execute.before    ← step 2 task call
[demo-logger] demo-looper    tool.execute.after     ← item_1.txt write
[demo-logger] demo-looper    tool.execute.after     ← item_2.txt write
[demo-logger] demo-looper    tool.execute.after     ← item_3.txt write
[demo-logger] demo-farewell  tool.execute.before    ← step 3 task call
[demo-logger] demo-farewell  tool.execute.after     ← summary.md write
```

The JSONL file contains the same events with timestamp, input schema, and path of the file touched. Useful for replaying the sequence after the fact, or for narrating the pipeline step by step.

---

## What the demo illustrates, level by level

| Level | Concept | Where it's demonstrated |
|---|---|---|
| L2 | Simple workflow | `demo_greet.md`, `demo_farewell.md` |
| L3 | Control flow + loop | `demo_loop.md` — `<demo-loop>` section with even/odd branching |
| L4 | Orchestration / delegation | `demo_orchestrate.md` — 3 sequential `task` calls |
| — | Custom agents | `demo-greeter`, `demo-looper`, `demo-farewell` — pure skills |
| — | TypeScript plugin | `demo-logger.ts` — event hooks + filtering + console + JSONL |
| — | Inter-step data flow | shared `OUTPUT_DIR`, files `topic.txt` → `items/` → `summary.md` |

---

## Extending the demo

A few ideas if you want to modify it without rewriting everything:

- **Add a step 4**: copy a sub-command + an agent pattern → the orchestrator just adds a 4th `task` call.
- **Parallelize some steps**: if two steps are independent, the orchestrator can issue multiple `task` calls in the same response (see `parallel_subagents.md`).
- **Swap in real generation**: replace the static item content by an LLM/MCP call — the agent stays the same, only the slash command's workflow changes.
- **Log metrics**: enrich `demo-logger.ts` to measure each step's duration (`before`/`after` timestamps → delta).
