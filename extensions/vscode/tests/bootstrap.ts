import * as vscode from 'vscode'
import * as fs from 'fs/promises'
import { before, beforeEach } from 'mocha'
import { workspace, notifications, quick_pick, editor } from './utils'

before(async () => {
  await vscode.extensions.getExtension('webneat.jisr')!.activate()
  vscode.window.showErrorMessage = async (message: string) => notifications.add({ type: 'error', message })
  vscode.window.showWarningMessage = async (message: string) => notifications.add({ type: 'warning', message })
  vscode.window.showInformationMessage = async (message: string) => notifications.add({ type: 'info', message })
  vscode.window.showQuickPick = (async (suggestions: quick_pick.Suggestion[], options: vscode.QuickPickOptions) => {
    quick_pick.add_arg({ suggestions, ...options })
    return quick_pick.get_results().shift()
  }) as any
})

beforeEach(async () => {
  await editor.close_all()
  const workspace_dir = workspace.file_path('.')
  await fs.mkdir(workspace_dir, { recursive: true })
  for (const entry of await fs.readdir(workspace_dir)) {
    await fs.rm(workspace.file_path(entry), { recursive: true, force: true })
  }
  notifications.clear()
  quick_pick.clear()
})
