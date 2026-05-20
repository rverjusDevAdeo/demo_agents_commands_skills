---
description: picks a static topic and writes it to topic.txt
agent: demo-greeter
---

# Demo Greet

Picks a topic from a static list and writes it to a file.

## Variables

OUTPUT_DIR: $1
TOPIC_LIST: `["animals", "colors", "fruits"]`

## Instructions

- No creative LLM call: the topic is picked **statically** to stay reproducible across demo runs.

## Workflow
0. If `OUTPUT_DIR` is empty or not provided, use `demo_outputs/standalone/` instead.
1. If `OUTPUT_DIR` does not exist, create it with `mkdir -p <OUTPUT_DIR>`.
2. Read the current second via `date +%S`, then compute `index = (second % 3)` to pick a topic from `TOPIC_LIST`.
3. Write the chosen topic to `<OUTPUT_DIR>/topic.txt` (no trailing newline).
4. Print the greeting to screen: `"Hello from demo_greet! Picked topic: <topic>"`.

## Report

```
demo_greet:
  topic: <topic>
  path: <OUTPUT_DIR>/topic.txt
  status: ✅
```
