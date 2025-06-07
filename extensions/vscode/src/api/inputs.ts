import * as vscode from 'vscode'
import {define} from './api'
import {SelectChoice} from '../interfaces'

define('inputs.select', async (args) => {
  const choices: SelectChoice[] = args.choices.map((choice) => {
    if (typeof choice === 'string') return { label: choice }
    return choice
  })
  const selected = await vscode.window.showQuickPick(choices, {
    title: args.title,
    placeHolder: args.placeholder,
    canPickMany: args.multiple || false,
  })
  if (!selected) return []
  return Array.isArray(selected) ? selected : [selected]
})