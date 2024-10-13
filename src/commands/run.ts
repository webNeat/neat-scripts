import * as vscode from 'vscode'
import { exec } from '../utils'
import * as readline from 'readline'

type Args = {
  script: string
  args?: string[]
}
type Context = {
  workspace_path: string
  file: string
  selections: Array<{
    start: { line: number; col: number }
    end: { line: number; col: number }
  }>
}
type Command = string | { command: string; args?: unknown }

export async function run(args: Args) {
  try {
    const editor = vscode.window.activeTextEditor
    if (editor) await vscode.commands.executeCommand('workbench.action.files.save')
    const ps = exec(args.script, args.args || [], JSON.stringify(getContext()))
    const lines = readline.createInterface({
      input: ps.stdout!,
      crlfDelay: Infinity,
    })
    for await (const line of lines) {
      try {
        await runCommand(JSON.parse(line))
      } catch {
        throw `Could not parse or run command '${line}'`
      }
    }
  } catch (e) {
    vscode.window.showErrorMessage(`Could not run script ${args.script}: ${e}`)
  }
}

function getContext(): Context {
  const editor = vscode.window.activeTextEditor
  const workspace_path = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || ''
  if (!editor) {
    return { workspace_path, file: '', selections: [] }
  }
  return {
    workspace_path,
    file: editor.document.uri.fsPath,
    selections: editor.selections.map((selection) => ({
      start: { line: selection.start.line + 1, col: selection.start.character + 1 },
      end: { line: selection.end.line + 1, col: selection.end.character + 1 },
    })),
  }
}

async function runCommand(command: Command) {
  if (typeof command === 'string') return vscode.commands.executeCommand(command)
  return vscode.commands.executeCommand(command.command, command.args)
}
