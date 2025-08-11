import * as vscode from 'vscode'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs/promises'
import dedent from 'dedent'

export async function create_files(files: Record<string, string>) {
  for (let [filename, content] of Object.entries(files)) {
    filename = file_path(filename)
    await fs.mkdir(path.dirname(filename), { recursive: true })
    await fs.writeFile(filename, dedent(content))
  }
}

export function file_path(filename: string) {
  if (!filename.startsWith('/')) filename = path.join(root(), filename)
  return filename
}

export function root() {
  const vscode_root = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath
  const fallback_dir = path.resolve('./tests-workspace')
  return vscode_root || fallback_dir
}