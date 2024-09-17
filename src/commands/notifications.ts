import * as vscode from 'vscode'

type Args = {
  message: string
}

export function info({ message }: Args) {
  vscode.window.showInformationMessage(message)
}

export function warning({ message }: Args) {
  vscode.window.showWarningMessage(message)
}

export function error({ message }: Args) {
  vscode.window.showErrorMessage(message)
}
