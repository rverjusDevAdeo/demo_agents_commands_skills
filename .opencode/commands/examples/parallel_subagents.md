---
description: Launch parallel agents to accomplish a task.
agent: build
---

# Parallel Subagents

Follow the `Workflow` below to launch `COUNT` agents in parallel to accomplish a task detailed in the `PROMPT_REQUEST`.

## Variables

PROMPT_REQUEST: $1
COUNT: $2

## Workflow

1. Parse Input Parameters
   - Extract PROMPT_REQUEST to understand the task
   - Determine COUNT (use provided value or infer from task complexity)

2. Design Agent Prompts
   - Create detailed, self-contained prompts for each agent
   - Include specific instructions on what to accomplish
   - Define clear output expectations
   - Remember agents are stateless and need complete context

3. Launch Parallel Agents
   - Use the `task` tool to spawn N opencode subagents simultaneously
   - Set `subagent_type` to the @-name of the target agent (e.g. `general` for generic work, or a specialist like `crypto-coin-analyzer`)
   - IMPORTANT: Issue all `task` calls in a single batched response so they actually run in parallel

4. Collect & Summarize Results
   - Gather outputs from all completed agents
   - Synthesize findings into cohesive response
