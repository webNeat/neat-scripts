import * as vscode from 'vscode'
import {file_path} from './workspace'

export async function close_all() {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
}

export async function open_file(filename: string) {
  filename = file_path(filename)
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(filename))
}

export function move_cursor(line: number, col: number) {
  const editor = vscode.window.activeTextEditor
  if (!editor) return
  editor.selection = new vscode.Selection(new vscode.Position(line - 1, col - 1), new vscode.Position(line - 1, col - 1))
}

export function get_content() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return ''
  return editor.document.getText()
}
