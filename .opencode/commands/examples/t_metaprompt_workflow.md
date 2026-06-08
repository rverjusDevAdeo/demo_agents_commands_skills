---
description: Create a new prompt
agent: build
model: github-copilot/claude-opus-4.5
---

# MetaPrompt

Based on the `High Level Prompt`, follow the `Workflow` to create a new prompt in the `Specified Format`. Before you start, WebFetch everything in the `Documentation`.

## Variables

HIGH_LEVEL_PROMPT: $ARGUMENTS

## Workflow

- We're building a new prompt to satisfy the request detailed in the `High Level Prompt`.
- Save the new prompt to `.opencode/commands/<name_of_prompt>.md`
  - The name of the prompt should make sense based on the `High Level Prompt`
- VERY IMPORTANT: The prompt should be in the `Specified Format`
  - Do not create any additional sections or headers that are not in the `Specified Format`
- IMPORTANT: As you're working through the `Specified Format`, replace every block of `<some request>` with the request detailed within the braces.
- Note we're calling these 'prompts' — they're also known as custom slash commands.
- Use the `task` tool with `subagent_type: "docs-scraper"` (or `general`) — one task per documentation item — to gather documentation quickly in parallel. Issue all task calls in a single batched response.
- Ultra Think — you're operating a prompt that builds a prompt. Stay focused on the details of creating the best high quality prompt for other AI agents.
- If the `High Level Prompt` requested multiple arguments, give each their own h2 header and then place `$ARGUMENTS` right below their respective h2 header. These prompts use an index based system.
- Note: if no variables are requested or mentioned, do not create a `Variables` section.
- Think through what the static variables vs dynamic variables are and place them accordingly with dynamic variables coming first and static variables coming second.
  - Prefer the `$1`, `$2`, ... over the `$ARGUMENTS` notation.

## Documentation

opencode Commands Documentation: https://opencode.ai/docs/commands/
opencode Tools and Permissions: https://opencode.ai/docs/tools/
opencode Agents Documentation: https://opencode.ai/docs/agents/

## Specified Format
```md
---
description: <description we'll use to id this prompt>
agent: <build | plan | one of your custom agents>
model: <github-copilot/claude-sonnet-4.6 | github-copilot/claude-opus-4.5 | github-copilot/claude-haiku-4.5>
---

# <name_of_prompt>

<prompt purpose: here we describe what the prompt does at a high level and reference any sections we create that are relevant like the `Instructions` section. Every prompt must have an `Instructions` section where we detail the instructions for the prompt in a bullet point list>

## Variables

<NAME_OF_DYNAMIC_VARIABLE>: $1
<NAME_OF_DYNAMIC_VARIABLE>: $2
<NAME_OF_STATIC_VARIABLE>: <SOMETHING STATIC>

## Workflow
<step by step numbered list of tasks to complete to accomplish the prompt>

## Report
<details of how the prompt should respond back to the user based on the prompt>
```
