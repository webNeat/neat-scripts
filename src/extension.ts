import * as vscode from 'vscode'
import * as commands from './commands'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('neat-scripts.run', commands.run))
  context.subscriptions.push(vscode.commands.registerCommand('neat-scripts.files.open', commands.files.open))
  context.subscriptions.push(vscode.commands.registerCommand('neat-scripts.notifications.info', commands.notifications.info))
  context.subscriptions.push(vscode.commands.registerCommand('neat-scripts.notifications.warning', commands.notifications.warning))
  context.subscriptions.push(vscode.commands.registerCommand('neat-scripts.notifications.error', commands.notifications.error))
}

export function deactivate() {}
