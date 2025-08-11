import * as vscode from 'vscode'
import {define} from './api'

define('files.open', async (args) => {
  const document = await vscode.workspace.openTextDocument(args.file_path)
  await vscode.window.showTextDocument(document)
})
