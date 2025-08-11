import * as path from 'path'
import * as vscode from 'vscode'
import {define} from './api'

define('context', async () => {
  const editor = vscode.window.activeTextEditor
  let workspace_path = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || ''
  if (!editor) {
    return { workspace_path, file_path: '', selections: [] }
  }
  workspace_path = workspace_path || path.dirname(editor.document.uri.fsPath)
  return {
    workspace_path,
    file_path: editor.document.uri.fsPath,
    selections: editor.selections.map((selection) => ({
      start: { line: selection.start.line + 1, col: selection.start.character + 1 },
      end: { line: selection.end.line + 1, col: selection.end.character + 1 },
    })),
  }
})