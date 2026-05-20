---
description: Pedagogical demo — orchestrates 3 sub-commands sequentially with file-based data flow
agent: build
model: github-copilot/claude-sonnet-4.6
---

# Demo Orchestrate

Chains **sequentially** three slash commands (`/demo_greet` → `/demo_loop` → `/demo_farewell`), each delegated to its own dedicated agent. The output of each step (written to a file under `OUTPUT_DIR`) is consumed as input by the next step.

## Variables

COUNT: $1 or 3 if not provided
OUTPUT_DIR: `demo_outputs/<timestamp>/`

## Instructions

- The order is **strictly sequential**: each step must wait for the previous one to finish before starting. DO NOT batch the `task` calls in a single response (that's the opposite of `parallel_subagents.md`).
- **Never rewrite** the contents of the sub-workflows here. The orchestrator's only role is to **chain** the slash commands by passing the right arguments — each slash command remains the single source of truth for its own workflow.
- The `<timestamp>` is shared across all 3 steps via `OUTPUT_DIR`; each sub-command receives that path as its `$1` argument.

## Workflow

1. Generate the current timestamp: `<TS> = $(date +%Y-%m-%d_%H-%M-%S)`.
2. Define `OUTPUT_DIR = demo_outputs/<TS>/` and create the directory with `mkdir -p`.

3. **Step 1 — demo-greeter**: call the `task` tool with:
   - `prompt: "Run /demo_greet <OUTPUT_DIR> (workflow defined in .opencode/commands/demo/demo_greet.md)"`
   - WAIT for completion before moving on.

4. **Step 2 — demo-looper**: call the `task` tool with:
   - `prompt: "Run /demo_loop <OUTPUT_DIR> <COUNT> (workflow defined in .opencode/commands/demo/demo_loop.md)"`
   - WAIT for completion.

5. **Step 3 — demo-farewell**: call the `task` tool with:
   - `prompt: "Run /demo_farewell <OUTPUT_DIR> (workflow defined in .opencode/commands/demo/demo_farewell.md)"`
   - WAIT for completion.

6. (Optional) `open <OUTPUT_DIR>` to open the directory in Finder.

## Report

```
demo_orchestrate:
  output_dir: <OUTPUT_DIR>
  steps:
    - step: /demo_greet
      status: ✅
    - step: /demo_loop
      status: ✅
    - step: /demo_farewell
      status: ✅
  next: cat <OUTPUT_DIR>/summary.md
```
