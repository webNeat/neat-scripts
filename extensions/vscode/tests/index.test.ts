import expect from 'expect'
import * as vscode from 'vscode'
import { suite, it } from 'mocha'

suite('jisr extension', () => {
  it('registers commands', async () => {
    const commands = await vscode.commands.getCommands(true)
    expect(commands).toContain('jisr.run_script')
  })
})
