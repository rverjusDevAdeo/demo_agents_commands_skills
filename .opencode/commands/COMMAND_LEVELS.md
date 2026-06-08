# Slash Command Levels

A slash command is a Markdown file under `.opencode/commands/` whose frontmatter
and body describe a reusable workflow. Commands form a ladder of **7 levels**,
from a one-shot static prompt to a self-improving expert system.

This document describes each level, from simplest to most advanced, with one
concrete example taken from this repo. Higher levels build on lower ones — a
Level 7 command still contains a Level 2 workflow inside it.

| Level | Name | Defining trait | Example |
|---|---|---|---|
| 1 | High Level Prompt | Static, no variables, one-shot | `examples/prime.md` |
| 2 | Workflow Prompt | Variables + sequential steps + frontmatter | `demo/demo_greet.md` |
| 3 | Control Flow Prompt | Loops and conditionals | `demo/demo_loop.md` |
| 4 | Delegation Prompt | Spawns parallel subagents via `task` | `examples/parallel_subagents.md` |
| 5 | Higher Order Prompt | Executes content produced elsewhere (plan/spec/bundle) | `examples/build.md` |
| 6 | Template Metaprompt | Generates other prompts from a description | `examples/t_metaprompt_workflow.md` |
| 7 | Self Improving Prompt | Updates its own `Expertise` after each run | `examples/experts/oc_plugin_expert/oc_plugin_expert_improve.md` |

---

## Anatomy of a command — the sections

A command is assembled from a fixed set of sections. Only the frontmatter and a
body instruction are strictly required (Level 1); every other section is added as
the command climbs the levels. The table shows what each section is for and from
which level it typically appears.

| Section | Purpose | From level |
|---|---|---|
| **Frontmatter (Metadata)** | YAML header: `description` (required), `agent` (which agent runs it). The `model` lives on the agent, not the command. | All (`description`), `agent` L2+ |
| **Title** | `# Action-oriented name` — first line of the body | All |
| **Purpose** | What the command does and when to use it (1–2 sentences) | All |
| **Variables** | Dynamic args (`$1`, `$2`, `$ARGUMENTS`) and static values | L1+ (optional) |
| **Instructions** | Rules, constraints, guardrails (`IMPORTANT:`, `STOP if…`) | L2+ |
| **Relevant Files** | Files the command reads or modifies | L2+ (optional) |
| **Codebase Structure** | Expected project tree the command relies on | L2+ (optional) |
| **Workflow** | Numbered execution steps — the core of the command | L2+ |
| **Specified Format** | The output template a metaprompt must fill in | L6 only |
| **Expertise** | Living knowledge base, auto-updated after each run | L7 only |
| **Examples** | Concrete usage scenarios | Optional |
| **Report** | How to present the results back to the user | L2+ |

### A fully-sectioned skeleton

```markdown
---
description: <short, action-oriented summary>   ← Frontmatter / Metadata
agent: build                                    ← which agent runs the workflow
                                                  (the model is set on the agent, not here)
---

# Command Title                                 ← Title

One or two sentences on what it does.           ← Purpose

## Variables                                    ← Variables
ARG_ONE: $1
ARG_TWO: $2 or <default> if not provided

## Instructions                                 ← Instructions (rules / guardrails)
- IMPORTANT: <constraint>
- If <precondition fails>, STOP and ask the user.

## Workflow                                     ← Workflow (the core steps)
1. <step one>
2. <step two>

## Report                                       ← Report (output shape)
Summarize the result as <format>.
```

The sections build up with the level: **L1** = Title + Purpose (and optionally a
few Variables); **L2** adds a structured Workflow plus Instructions and Report;
**L6** adds *Specified Format*; **L7** adds *Expertise*. The per-level examples
below show each addition in context.

---

## Level 1 — High Level Prompt

The minimal command: a `description` and a short instruction, with no structured
multi-step `## Workflow` and no branching. It may still declare a `## Variables`
block and take a simple argument — what makes it Level 1 is the absence of a
real workflow, not the absence of variables. Essentially a saved prompt you
trigger by name.

**When to use it:** a fixed, repeatable instruction you don't want to retype
(prime the context, run a standard check).

**Example — `examples/prime.md`:**

```markdown
---
description: Gain a general understanding of the codebase
---

# Prime

Execute the `Workflow` and `Report` sections to understand the codebase then
summarize your understanding.

## Workflow

- Run `git ls-files` to list all files in the repository.
- Read `README.md` for an overview of the project.

## Report

Summarize your understanding of the codebase.
```

Run it with `/prime`. No argument needed.

---

## Level 2 — Workflow Prompt

Adds YAML frontmatter, a `## Variables` block (arguments), and a deterministic,
**strictly sequential** list of steps — step 1, then 2, then 3. Arguments are read
with `$1`, `$2`, … (positional) or `$ARGUMENTS` (everything). Usually ends with a
`## Report` section describing the output.

**When to use it:** a parameterized but linear task — take an input, do a few steps
in order, produce one output.

**Example — `demo/demo_greet.md`:**

```markdown
---
description: picks a static topic and writes it to topic.txt
---

# Demo Greet

## Variables

OUTPUT_DIR: $1
TOPIC_LIST: `["animals", "colors", "fruits"]`

## Workflow
0. If `OUTPUT_DIR` is empty, use `demo_outputs/standalone/` instead.
1. If `OUTPUT_DIR` does not exist, create it with `mkdir -p <OUTPUT_DIR>`.
2. Read the current second via `date +%S`, compute `index = (second % 3)` to pick a topic.
3. Write the chosen topic to `<OUTPUT_DIR>/topic.txt`.
4. Print: `"Hello from demo_greet! Picked topic: <topic>"`.

## Report

Report the chosen topic and the output path.
```

Run it with `/demo_greet demo_outputs/test`.

---

## Level 3 — Control Flow Prompt

Introduces **loops and conditionals**: repeat a block `N` times, branch on a
condition, stop early if a precondition fails. The behavior now depends on the
data, not just on a fixed sequence. Loops are often wrapped in XML-style tags
(e.g. `<demo-loop> … </demo-loop>`) to delimit the repeated block.

**When to use it:** a variable number of items to process, or different paths
depending on the input/state.

**Example — `demo/demo_loop.md`** (loop + even/odd branching + guard clauses):

```markdown
---
description: reads a topic and generates N items through a loop
---

# Demo Loop

## Variables

OUTPUT_DIR: $1
COUNT: $2 or 3 if not provided

## Workflow

- If `<OUTPUT_DIR>/topic.txt` does not exist, STOP and report.   ← guard / conditional
- Read `<OUTPUT_DIR>/topic.txt` → variable `TOPIC`.

<demo-loop>
  For each `i` from 1 to `COUNT`:                                ← loop
  - Generate a short fact about `<TOPIC>`, distinct each time.
  - Write it to `<OUTPUT_DIR>/items/item_<i>.txt`.
  - If `i` is even:  print "even item generated (i=<i>)".        ← branching
  - Else:            print "odd item generated (i=<i>)".
</demo-loop>
```

Run it with `/demo_loop demo_outputs/test 5`.

---

## Level 4 — Delegation Prompt

The command stops doing the work itself and **delegates** to subagents via the
`task` tool. It writes a self-contained prompt per subagent and spawns them — often
**in parallel**, by issuing all `task` calls in a single batched response — then
collects and synthesizes their results.

Key rule: subagents are **stateless**. Each one receives a complete prompt with
zero context from the parent, so everything it needs must be in that prompt.

**When to use it:** independent, multi-domain, or background work that can run
concurrently — fan out to N agents, then merge their outputs.

**Example — `examples/parallel_subagents.md`:**

```markdown
---
description: Launch parallel agents to accomplish a task.
---

# Parallel Subagents

## Variables

PROMPT_REQUEST: $1
COUNT: $2

## Workflow

1. Parse PROMPT_REQUEST and determine COUNT.
2. Design a self-contained prompt for each agent (they are stateless).
3. Launch the agents: issue ALL `task` calls in a SINGLE batched response
   so they actually run in parallel.
4. Collect every agent's output and synthesize the findings into one answer.
```

Run it with `/parallel_subagents "audit each module for dead code" 4`.

> Delegation can also be **sequential** (one `task` at a time, waiting between
> each) when steps depend on one another — see `demo/demo_orchestrate.md`, which
> chains `/demo_greet` → `/demo_loop` → `/demo_farewell` in strict order.

---

## Level 5 — Higher Order Prompt

The command executes **content produced elsewhere** — a plan, spec, or bundle. The
prompt is a stable framework; the input is the variable content. This is
**composition, not delegation**: the same command can run any plan, regardless of
who produced it. The input is most often passed as a **file path** (as in `examples/build.md`
below), but it doesn't have to be — it can be inline content or any reference the
command knows how to resolve. What defines the level is the *higher-order* shape
(executing another prompt's output), not the form of the argument.

**When to use it:** execute plans/specs/bundles generated elsewhere — decouple
*how to execute* (the command) from *what to execute* (the input).

**Example — `examples/build.md`:**

```markdown
---
description: Build the codebase based on the plan
agent: build
---

# Build

Follow the `Workflow` to implement the `PATH_TO_PLAN` then `Report` the work.

## Variables

PATH_TO_PLAN: $ARGUMENTS

## Workflow

- If no `PATH_TO_PLAN` is provided, STOP and ask the user to provide it.
- Read the plan at `PATH_TO_PLAN`. Think hard, then implement it into the codebase.

## Report

- Summarize the work in a concise bullet list.
- Report files and lines changed with `git diff --stat`.
```

Run it with `/build specs/auth-refactor.md`.

---

## Level 6 — Template Metaprompt

A prompt that **generates other prompts**. Given a high-level description, it
produces a brand-new slash command file, written to a fixed `Specified Format`
(template). This is the factory: a prompt whose output is another prompt.

**When to use it:** turn a one-line description into a fully structured slash
command, instead of hand-writing it.

**Example — `examples/t_metaprompt_workflow.md`:**

```markdown
---
description: Create a new prompt
agent: build
---

# MetaPrompt

Based on the `High Level Prompt`, follow the `Workflow` to create a new prompt
in the `Specified Format`.

## Variables

HIGH_LEVEL_PROMPT: $ARGUMENTS

## Workflow

- Save the new prompt to `.opencode/commands/<name_of_prompt>.md`.
- VERY IMPORTANT: the prompt MUST follow the `Specified Format` — no extra sections.
- Replace every `<some request>` block in the template with the requested content.

## Specified Format
  (the template skeleton that the generated prompt must fill in)
```

Run it with `/t_metaprompt_workflow "a command that lints and formats staged files"`.

> Pipeline note: a Level 6 metaprompt's **output** (a generated plan/spec/prompt)
> becomes a Level 5 command's **input**. L6 produces, L5 consumes.

---

## Level 7 — Self Improving Prompt

The most advanced level: the command keeps a living `## Expertise` section that it
**updates after each run**. The `Workflow` stays stable; only the knowledge base
grows. Best practice is to split execution (plan/build) from learning (improve),
so the improve command's only job is to refine the expertise.

**When to use it:** recurring expert tasks in a specific domain, where the system
should get better over time instead of repeating the same mistakes.

**Example — `examples/experts/oc_plugin_expert/oc_plugin_expert_improve.md`:**

```markdown
---
description: Review plugin changes and update expert knowledge with improvements
---

# opencode Plugin Expert Improve

You are an opencode Plugin Expert specializing in continuous improvement.

## Workflow

1. Review all recent changes to plugin-related files.
2. Identify successful patterns and extract learnings.
3. Update ONLY the `## Expertise` sections of the expert commands — keep the
   `Workflow` sections stable.

## Expertise

  (a living knowledge base, appended to after every run)
```

Run it with `/examples/experts/oc_plugin_expert/oc_plugin_expert_improve`.

---

## Decision tree — picking a level

```
Does it LEARN and improve over time?                    → L7 (Self Improving)
Does it GENERATE another prompt/file from a template?   → L6 (Template Metaprompt)
Does it EXECUTE content produced elsewhere (plan/spec)? → L5 (Higher Order)
Does it DELEGATE work to subagents via `task`?          → L4 (Delegation)
Does it have LOOPS or IF/ELSE in the workflow?          → L3 (Control Flow)
Does it have a structured multi-step WORKFLOW?          → L2 (Workflow)
None of the above (one-shot instruction, variables ok)? → L1 (High Level)
```
