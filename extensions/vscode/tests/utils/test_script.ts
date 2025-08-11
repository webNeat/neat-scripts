import * as os from 'os'
import * as path from 'path'
import * as crypto from 'crypto'
import * as fs from 'fs/promises'
import dedent from 'dedent'
import expect from 'expect'
import * as vscode from 'vscode'
import { CommandName, CommandRequest, CommandResponse } from '../interfaces'

export function test_script(script_path: string) {
  let expected_args: string[] = []
  let expected_stdin_lines: string[] = []
  let stdout_lines: string[] = []
  let error: string | undefined

  const receives_args = (args: string[]) => {
    expected_args = args
  }
  const reads = (data: CommandResponse<CommandName>) => {
    expected_stdin_lines.push(JSON.stringify(data))
  }
  const writes = (data: CommandRequest<CommandName>) => {
    stdout_lines.push(JSON.stringify(data))
  }
  const run = async (args: string[] = []) => {
    return simulate_run(script_path, args, stdout_lines, error)
  }
  const test = async (args: string[] = []) => {
    const {received_args, received_stdin_lines} = await run(args)
    expect(received_args).toEqual(expected_args)
    expect(received_stdin_lines).toEqual(expected_stdin_lines)
  }
  const fails = (err: string) => {
    error = err
  }

  return {receives_args, reads, writes, run, test, fails}
}

async function simulate_run(script_path: string, args: string[], stdout_lines: string[], error: string | undefined) {
  const log_filename = path.join(os.tmpdir(), crypto.randomBytes(32).toString('hex') + '.log')
  const content = script_content(log_filename, stdout_lines, error)
  await fs.writeFile(script_path, content)
  await fs.chmod(script_path, 0o755)
  await vscode.commands.executeCommand('jisr.run_script', { script_path, args })
  const [args_line, ...received_stdin_lines] = await fs.readFile(log_filename, 'utf-8').then(content => content.trimEnd().split('\n'))
  return {received_args: JSON.parse(args_line), received_stdin_lines}
}

function script_content(log_filename: string, stdout_lines: string[], error: string | undefined) {
  return dedent`
    #!/usr/bin/env node

    const os = require('os')
    const fs = require('fs/promises')
    const readline = require('readline/promises')
    const stdin = readline.createInterface({ input: process.stdin })

    async function log(text) {
      await fs.appendFile('${log_filename}', text + os.EOL)
    }
    function read_line() {
      return stdin.question('')
    }

    async function main() {
      await log(JSON.stringify(process.argv.slice(2)))
      ${error ? `throw new Error(${JSON.stringify(error)})` : ''}
      ${stdout_lines.map(line => `
        console.log(${JSON.stringify(line)})
        await log(await read_line())
      `).join('\n')}
      stdin.close()
    }
    main()
  `
}