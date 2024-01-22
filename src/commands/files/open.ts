import * as vscode from 'vscode'

type Args = {
  path: string
}
export async function open(args: Args) {
  try {
    const document = await vscode.workspace.openTextDocument(args.path)
    await vscode.window.showTextDocument(document)
  } catch (e) {
    vscode.window.showErrorMessage(`Could not open file at '${args.path}': ${e}`)
  }
}
