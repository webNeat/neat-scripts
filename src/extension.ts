import * as vscode from 'vscode'
import * as commands from './commands'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('scripts.run', commands.run))
  context.subscriptions.push(vscode.commands.registerCommand('scripts.files.open', commands.files.open))
}

export function deactivate() {}
