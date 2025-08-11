import * as vscode from 'vscode'

export type Suggestion = { label: string; description?: string }
type Arg = vscode.QuickPickOptions & {
  suggestions: Array<Suggestion>
}

let args: Arg[] = []
let results: Array<Suggestion | Suggestion[]> = []

export function add_arg(options: Arg) {
  args.push(options)
}

export function add_result(result: Suggestion | Suggestion[]) {
  results.push(result)
}

export function get_args() {
  return args
}
export function get_results() {
  return results
}
export function clear() {
  args = []
  results = []
}
