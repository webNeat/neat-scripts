import * as vscode from 'vscode'

type Args = {
  title?: string
  multiple?: boolean
  suggestions: Array<{ label: string; description?: string }>
}

export async function show(args: Args) {
  const selected = await vscode.window.showQuickPick(args.suggestions, {
    title: args.title,
    placeHolder: '',
    canPickMany: args.multiple || false,
  })
  const editor = vscode.window.activeTextEditor

  if (selected && editor) {
    const text = Array.isArray(selected) ? selected.map((x) => x.label).join(', ') : selected.label || ''
    editor.edit((editBuilder) => editBuilder.replace(editor.selection, text))
  }
}
