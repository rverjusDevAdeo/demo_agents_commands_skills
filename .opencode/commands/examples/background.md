---
description: Fires off a full opencode instance in the background
agent: build
model: github-copilot/claude-opus-4.5
---

# Background opencode

Run an opencode instance in the background to perform tasks autonomously while you continue working.

## Variables

USER_PROMPT: $1
MODEL: $2 (defaults to `github-copilot/claude-sonnet-4.6` if not provided)
REPORT_FILE: $3 (defaults to `./agents/background/background-report-DAY-NAME_HH_MM_SS.md` if not provided)

## Instructions

- Capture timestamp in a variable FIRST to ensure consistency across file creation and references
- Create the initial report file with header BEFORE launching the background agent
- Fire off a new `opencode run` instance using the Bash tool with `run_in_background=true`
- IMPORTANT: Pass the `USER_PROMPT` exactly as provided with no modifications
- Set the model to either `github-copilot/claude-sonnet-4.6` or `github-copilot/claude-opus-4.5` based on the `MODEL` parameter
- Use the `--print` flag for non-interactive mode
- Use `--agent background-runner` (defined in `opencode.json`) to bypass permission prompts
- All report format instructions are embedded in the `--prompt` (system prompt prepended to the user prompt)
- Use all provided CLI flags AS IS. Do not alter them.
- IMPORTANT: Do not alter the embedded system prompt in any way.

## Workflow

1. Create the report directory if it doesn't exist:
   ```bash
   mkdir -p agents/background
   ```

2. Set default values for parameters:
   - `MODEL`
   - `TIMESTAMP` (capture once for consistency)
   - `REPORT_FILE` (using the captured timestamp)

3. Create the initial report file with just the header (IMPORTANT: Only IF no report file is provided — if it is provided, echo it and skip this step):
   Get this into your context window so you know what to pass into the opencode command.
   ```bash
   TIMESTAMP=$(date +%a_%H_%M_%S)
   echo "TIMESTAMP: ${TIMESTAMP}"
   REPORT_FILE="${REPORT_FILE:-./agents/background/background-report-${TIMESTAMP}.md}"
   echo "REPORT_FILE: ${REPORT_FILE}"
   echo "# Background Agent Report - ${TIMESTAMP}" > "${REPORT_FILE}"
   ```

<primary-agent-delegation>
4. Construct the opencode command with all settings:

   - Execute the command using Bash with `run_in_background=true`

   ```bash
   opencode run \
     --model "${MODEL}" \
     --agent background-runner \
     --print \
     "IMPORTANT: You are running as a background agent. Your primary responsibility is to execute work and document your progress continuously in ${REPORT_FILE}. Iteratively write to the report file continuously as you work. Every few tool calls you should update the REPORT_FILE ## Progress section. Follow this file structure.

## WORKFLOW

   IMPORTANT: You MUST follow this workflow as you work:

   1. The file ${REPORT_FILE} has been created with a header. You must UPDATE it as you proceed (not recreate it) with this EXACT markdown structure:

   \`\`\`markdown
   # Background Agent Report - DAY-NAME_HH_MM_SS

   ## Task Understanding
   Clearly state what the user requested. Break down complex requests into numbered items:
   User requested:
   1. [First task item]
   2. [Second task item]
   3. [Next task item]

   ## Progress
   IMPORTANT: Document each major step as you work. Update this section as you work:
   - Starting task execution
   - [Action taken with tool/command used]
   - [Finding or observation]
   - [Next action]
   (Keep adding bullets as you work)

   ## Results
   List concrete outcomes and deliverables with specific details. Update as you work:
   - [Specific file created/modified with path]
   - [Numeric data or metrics]
   - [Actual accomplishments]

   ## Task Completed (or Task Failed)
   [Final summary - success confirmation or failure explanation]

   ADDITIONAL SECTIONS (add as needed):
   - ## Blockers - Issues preventing progress
   - ## Decisions Made - Important choices and rationale
   - ## Recommendations - Follow-up suggestions
   - ## Warnings - Important issues to note


   CONTINUOUSLY update ${REPORT_FILE} as you work - after each major step or finding.

   When you finish your work:
      - If successful: Rename ${REPORT_FILE} to ${REPORT_FILE.md}.complete.md
      - If failed/blocked: Rename ${REPORT_FILE} to ${REPORT_FILE.md}.failed.md

   Remember: The report is your PRIMARY output. Update it frequently and thoroughly.
   \`\`\`

USER PROMPT: ${USER_PROMPT}"
   ```
</primary-agent-delegation>

5. After you kick off the background agent, use the BashOutput tool (or `tail -f` on the report file) to check the status of the background agent
   - If something goes wrong investigate and report back to the user
   - If everything is working fine, continue to the `Response to User` section

## Response to User

After launching the background agent, respond with:

```
Background opencode kicked off. Agent is writing to `REPORT_FILE` as it works.
When it completes it will rename the file to `REPORT_FILE.complete.md` on success or `REPORT_FILE.failed.md` if it fails.
```
