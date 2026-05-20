---
description: Demo subtask 3 — reads all items and writes a closing summary.md
agent: demo-farewell
---

# Demo Farewell

Last step of the pedagogical pipeline. Reads the items produced by `demo_loop`, composes a markdown summary and writes `summary.md` in the same directory.

## Variables

OUTPUT_DIR: $1

## Instructions

- If `OUTPUT_DIR` is not provided, STOP immediately and ask the user.
- If `<OUTPUT_DIR>/items/` does not exist or is empty, STOP and report that `demo_loop` must have run first.

## Workflow

1. Check that `<OUTPUT_DIR>/items/` exists and contains at least one file. Otherwise STOP.
2. Read the topic from `<OUTPUT_DIR>/topic.txt` → variable `TOPIC`.
3. List the files `<OUTPUT_DIR>/items/item_*.txt` sorted by numeric order.
4. For each file, read its content and keep it alongside its base filename.
5. Compose markdown in the following format:

```
# Demo summary

- Topic: <TOPIC>
- Items generated: <N>

## Details

- item_1.txt: <content>
- item_2.txt: <content>
- ...

Goodbye from demo_farewell.
```

6. Write that markdown to `<OUTPUT_DIR>/summary.md`.

## Report

```
demo_farewell:
  topic: <TOPIC>
  items_summarized: <N>
  summary_path: <OUTPUT_DIR>/summary.md
  status: ✅
```
