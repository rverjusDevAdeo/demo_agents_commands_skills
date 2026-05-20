import type { Plugin } from "@opencode-ai/plugin"
import { mkdir, appendFile } from "node:fs/promises"
import { join } from "node:path"

function logDir(sessionId: string): string {
  return join(process.cwd(), "agents", "demo_logs", sessionId)
}

// A command is demo-relevant when any path segment of its name starts with
// "demo" (covers /demo-presenter, /demo_greet, /demo/demo_greet, /demo).
function isDemoCommand(name: string): boolean {
  return /(^|\/)demo([-_/]|$)/.test(name)
}

// Per-session state for a demo command currently in flight.
type ActiveCommand = {
  command: string
  args: string
  agent?: string
  skill?: string
  tools: string[]
  card?: string
}
const active = new Map<string, ActiveCommand>()

// Skills surface as tool calls (permission `skill`), not as a dedicated SDK
// type — detect the demo format skills from the tool name or its args.
function detectSkill(tool: string, args: Record<string, any>): string | undefined {
  const hay = (tool + " " + JSON.stringify(args ?? {})).toLowerCase()
  const m = hay.match(/demo-(yaml|json)/)
  if (m) return m[0]
  if (/\bskills?\b/.test(tool.toLowerCase())) return args?.name ?? args?.skill
  return undefined
}

// Infer the output format from the produced card, as a fallback when the
// skill was never invoked as an explicit tool.
function inferFormat(text: string | undefined): string {
  const t = (text ?? "").trim()
  if (!t) return "unknown"
  if (t.startsWith("{") || t.startsWith("[")) return "json"
  if (t.startsWith("---") || /^[\w-]+:\s/.test(t)) return "yaml"
  if (t.startsWith("#") || t.includes("\n- ")) return "markdown"
  return "unknown"
}

function compactArgs(args: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(args ?? {})) {
    out[k] = typeof v === "string" ? v.slice(0, 120) : v
  }
  return out
}

function eventSessionId(ev: any): string | undefined {
  const p = ev?.properties ?? {}
  return p.sessionID ?? p.session_id ?? p.info?.sessionID ?? p.info?.id
}

async function writeLog(
  sessionId: string,
  event: string,
  step: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    const dir = logDir(sessionId)
    await mkdir(dir, { recursive: true })
    const file = join(dir, "demo.jsonl")
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      step,
      ...details,
    })
    await appendFile(file, entry + "\n")
    console.log(`[demo-logger] ${step} ${event}`)
  } catch (err) {
    console.error("[demo-logger] failed to log:", err)
  }
}

export const demoLogger: Plugin = async () => {
  return {
    // 1. Command invocation — opens per-session state.
    "command.execute.before": async (input) => {
      const command = String(input.command ?? "")
      if (!isDemoCommand(command)) return
      const args = String(input.arguments ?? "")
      active.set(input.sessionID, { command, args, tools: [] })
      await writeLog(input.sessionID, "command.execute.before", command, {
        command,
        arguments: args.slice(0, 200),
      })
    },

    // 2. Capture which agent runs the command (e.g. demo-chtimi).
    "chat.params": async (input) => {
      const st = active.get(input.sessionID)
      if (st && input.agent) st.agent = input.agent
    },

    // 3a. Every tool call while a demo command is active.
    "tool.execute.before": async (input, output) => {
      const st = active.get(input.sessionID)
      if (!st) return
      const args = output.args ?? {}
      st.tools.push(input.tool)
      const skill = detectSkill(input.tool, args)
      if (skill) st.skill = skill
      await writeLog(input.sessionID, "tool.execute.before", st.command, {
        tool: input.tool,
        args: compactArgs(args),
        ...(skill ? { skill } : {}),
      })
    },

    // 3b. Tool result (concise).
    "tool.execute.after": async (input) => {
      const st = active.get(input.sessionID)
      if (!st) return
      await writeLog(input.sessionID, "tool.execute.after", st.command, {
        tool: input.tool,
      })
    },

    // 4. Remember the latest completed assistant text — the card.
    "experimental.text.complete": async (input, output) => {
      const st = active.get(input.sessionID)
      if (st && output.text) st.card = output.text
    },

    // 5. Session goes idle => the command finished. Flush a summary with the
    //    agent, the active format skill, the produced card, then close state.
    event: async (input) => {
      const ev: any = (input as any).event
      if (ev?.type !== "session.idle") return
      const sid = eventSessionId(ev)
      if (!sid) return
      const st = active.get(sid)
      if (!st) return
      active.delete(sid)
      await writeLog(sid, "command.complete", st.command, {
        command: st.command,
        agent: st.agent,
        skill: st.skill,
        format: st.skill ?? inferFormat(st.card),
        tools: st.tools,
        card: (st.card ?? "").slice(0, 2000),
      })
    },
  }
}

export default demoLogger