import type { Plugin } from "@opencode-ai/plugin"
import { mkdir, appendFile } from "node:fs/promises"
import { join } from "node:path"

function logDir(sessionId: string): string {
  return join(process.cwd(), "agents", "demo_logs", sessionId)
}

function extractSessionId(input: any): string {
  return (
    input?.sessionID ??
    input?.session?.id ??
    input?.session_id ??
    "unknown"
  )
}

function extractPrompt(input: any): string {
  return (
    input?.message?.text ??
    input?.prompt ??
    input?.content ??
    ""
  )
}

function extractToolName(input: any): string | undefined {
  return input?.tool ?? input?.toolName ?? input?.tool_name
}

function extractToolInput(input: any): Record<string, any> {
  return input?.toolInput ?? input?.tool_input ?? {}
}

function isDemoRelevant(
  event: "message.submit" | "tool.execute.before" | "tool.execute.after",
  input: any,
): { step: string; details: Record<string, unknown> } | null {
  if (event === "message.submit") {
    const prompt = extractPrompt(input).trim()
    if (prompt.startsWith("/demo_")) {
      return {
        step: prompt.split(/\s+/)[0].replace(/^\//, ""),
        details: { prompt: prompt.slice(0, 200) },
      }
    }
    return null
  }

  const tool = extractToolName(input)
  if (!tool) return null
  const toolInput = extractToolInput(input)

  // Match task calls into a demo-* subagent
  if (tool === "task") {
    const subagent: string | undefined =
      toolInput.subagent_type ?? toolInput.subagentType
    if (subagent && subagent.startsWith("demo-")) {
      return {
        step: subagent,
        details: {
          tool,
          subagent_type: subagent,
          description: toolInput.description,
        },
      }
    }
    return null
  }

  // Match file IO touching demo/ or demo_outputs/
  const filePath: string | undefined =
    toolInput.filePath ?? toolInput.file_path ?? toolInput.path
  if (
    filePath &&
    (filePath.includes("/demo/") ||
      filePath.includes("demo_outputs/") ||
      filePath.includes(".opencode/commands/demo/"))
  ) {
    return {
      step: inferStepFromPath(filePath),
      details: { tool, file: filePath },
    }
  }

  return null
}

function inferStepFromPath(filePath: string): string {
  if (filePath.includes("demo_greet")) return "demo-greeter"
  if (filePath.includes("demo_loop") || filePath.includes("/items/"))
    return "demo-looper"
  if (filePath.includes("demo_farewell") || filePath.includes("summary.md"))
    return "demo-farewell"
  if (filePath.includes("topic.txt")) return "demo-greeter"
  return "demo"
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
    "message.submit": async (input: any) => {
      const match = isDemoRelevant("message.submit", input)
      if (!match) return
      await writeLog(
        extractSessionId(input),
        "message.submit",
        match.step,
        match.details,
      )
    },
    "tool.execute.before": async (input: any) => {
      const match = isDemoRelevant("tool.execute.before", input)
      if (!match) return
      await writeLog(
        extractSessionId(input),
        "tool.execute.before",
        match.step,
        match.details,
      )
    },
    "tool.execute.after": async (input: any) => {
      const match = isDemoRelevant("tool.execute.after", input)
      if (!match) return
      await writeLog(
        extractSessionId(input),
        "tool.execute.after",
        match.step,
        match.details,
      )
    },
  }
}

export default demoLogger
