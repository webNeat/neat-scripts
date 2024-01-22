import * as vscode from 'vscode'
import { exec } from '../utils'

type Args = {
  script: string
}
type Context = {
  file: string
  selections: Array<{
    start: { line: number; col: number }
    end: { line: number; col: number }
  }>
}
type Command = string | { command: string; args?: unknown }

export async function run(args: Args) {
  try {
    const stdout = await exec(args.script, JSON.stringify(getContext()))
    for (const command of JSON.parse(stdout)) {
      await runCommand(command)
    }
  } catch (e) {
    vscode.window.showErrorMessage(`Could not run script ${args.script}: ${e}`)
  }
}

function getContext(): Context {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return { file: '', selections: [] }
  }
  return {
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
