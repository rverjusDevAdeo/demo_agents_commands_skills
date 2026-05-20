---
description: Demo subtask 2 — reads a topic and generates N items through a loop (Level 3 — Control Flow)
agent: demo-looper
---

# Demo Loop

Reads the `topic.txt` produced by `demo_greet`, then loops `COUNT` times to generate one static item per iteration.

## Variables

OUTPUT_DIR: $1
COUNT: $2 or 3 if not provided

## Instructions

- If `OUTPUT_DIR` is not provided, STOP immediately and ask the user.
- If `<OUTPUT_DIR>/topic.txt` does not exist, STOP and report that `demo_greet` must have run first.
- Each item's fact must be **generated content about the `TOPIC`** (a short, distinct fact per iteration — no repeats).

## Workflow

- Check that `<OUTPUT_DIR>/topic.txt` exists. Otherwise STOP.
- Read the contents of `<OUTPUT_DIR>/topic.txt` → variable `TOPIC`.
- Create the directory `<OUTPUT_DIR>/items/` with `mkdir -p`.
- IMPORTANT: For each `i` from 1 to `COUNT`, run the following loop:

<demo-loop>
  - Generate a short fact (`FACT`) about `<TOPIC>`, distinct from the facts produced in previous iterations.
  - Build the item content: `"Item #<i> related to <TOPIC>: <FACT>"`.
  - Write that content to `<OUTPUT_DIR>/items/item_<i>.txt`.
  - If `i` is even:
    - Print: `"[demo_loop] even item generated (i=<i>)"`.
  - Else:
    - Print: `"[demo_loop] odd item generated (i=<i>)"`.
</demo-loop>

- After the loop, count the generated files with `ls <OUTPUT_DIR>/items/ | wc -l`.

## Report

```
demo_loop:
  topic: <TOPIC>
  count: <COUNT>
  items_dir: <OUTPUT_DIR>/items/
  items_generated: <N>
  status: ✅
```
