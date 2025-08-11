import * as vscode from 'vscode'
import {define} from './api'

define('notifications.info', async ({ message }) => {
  vscode.window.showInformationMessage(message)
})

define('notifications.warning', async ({ message }) => {
  vscode.window.showWarningMessage(message)
})

define('notifications.error', async ({ message }) => {
  vscode.window.showErrorMessage(message)
})
