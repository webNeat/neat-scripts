import * as vscode from 'vscode'
import { run_script } from './run_script'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('jisr.run_script', run_script))
}

export function deactivate() {}