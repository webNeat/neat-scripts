import * as vscode from 'vscode'

type Args = {
  suggestions: string[]
}

export async function show(args: Args) {
  const selected = await vscode.window.showQuickPick(args.suggestions, {
    placeHolder: '',
    canPickMany: false,
  })
  const editor = vscode.window.activeTextEditor

  if (selected && editor) {
    editor.edit((editBuilder) => editBuilder.replace(editor.selection, selected))
  }
}
