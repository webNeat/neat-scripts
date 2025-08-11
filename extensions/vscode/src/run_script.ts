import * as vscode from 'vscode'
import { spawn } from 'child_process'
import * as readline from 'readline/promises'
import { execute } from './api'
import { Readable } from 'stream'

type Args = {
  script_path: string
  args: string[]
}
export async function run_script(args: Args) {
  try {
    const editor = vscode.window.activeTextEditor
    if (editor) await vscode.commands.executeCommand('workbench.action.files.save')
    const ps = spawn(args.script_path, args.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    await new Promise<void>(async (resolve, reject) => {
      try {
        const fail = async (err?: Error) => {
          const stderr = await read_stream(ps.stderr).catch(() => '')
          reject(err ? `${err.message}\n${stderr}` : stderr)
        }
        ps.on('error', fail)
        ps.on('exit', (code) => {
          if (code === 0) return resolve()
          return fail(new Error(`Script exited with code ${code}`))
        })
        for await (const line of readline.createInterface({ input: ps.stdout! })) {
          try {
            const res = await execute(JSON.parse(line))
            ps.stdin?.write(JSON.stringify(res) + '\n')
          } catch (error) {
            ps.stdin?.write(JSON.stringify({ success: false, error: String(error) }) + '\n')
          }
        }
      } catch (err) {
        reject(err)
      }
    })
  } catch (err) {
    console.log(`>>>>>>>>> Could not run script ${args.script_path}: ${err}`)
    vscode.window.showErrorMessage(`Could not run script ${args.script_path}: ${err}`)
  }
}

async function read_stream(stream?: Readable) {
  let content = ''
  if (stream) {
    for await (const chunk of stream) {
      content += chunk.toString()
    }
  }
  return content
}
