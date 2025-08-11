import expect from 'expect'
import * as vscode from 'vscode'
import { suite, it, test, beforeEach } from 'mocha'
import { workspace, editor, test_script, notifications, quick_pick } from './utils'

suite('command: jisr.run_script', () => {
  suite('runs the script and passes the args', () => {
    it('passes the args', async () => {
      const script = test_script(workspace.file_path('script.js'))
      script.receives_args(['foo', 'bar'])
      await script.test(['foo', 'bar'])
    })

    it('shows an error notification if the script fails', async () => {
      const script = test_script(workspace.file_path('script.js'))
      script.fails(`Oops!`)
      await script.run()
      expect(notifications.get()).toEqual([
        { type: 'error', message: expect.stringContaining(`Error: Oops!`) },
      ])
    })
  })

  suite('command: context', () => {
    beforeEach(async () => {
      await workspace.create_files({
        'file.txt': '',
      })
      await editor.open_file('file.txt')
    })
    it('returns the context', async () => {
      const script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'context', args: []})
      script.reads({success: true, result: {
        workspace_path: workspace.root(),
        file_path: workspace.file_path('file.txt'),
        selections: [
          { start: { line: 1, col: 1 }, end: { line: 1, col: 1 } },
        ],
      }})
      await script.test()
    })
  })

  suite('commands: notifications.*', () => {
    test('notifications.info', async () => {
      const script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'notifications.info', args: { message: 'hello' }})
      script.reads({success: true, result: undefined})
      await script.test()
      expect(notifications.get()).toEqual([
        { type: 'info', message: 'hello' },
      ])
    })
    test('notifications.warning', async () => {
      const script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'notifications.warning', args: { message: 'hello' }})
      script.reads({success: true, result: undefined})
      await script.test()
      expect(notifications.get()).toEqual([
        { type: 'warning', message: 'hello' },
      ])
    })
    test('notifications.error', async () => {
      const script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'notifications.error', args: { message: 'hello' }})
      script.reads({success: true, result: undefined})
      await script.test()
      expect(notifications.get()).toEqual([
        { type: 'error', message: 'hello' },
      ])
    })
  })

  suite('command: files.open', () => {
    beforeEach(() => workspace.create_files({
      'index.ts': '',
      'test.txt': 'hello',
    }))

    it('opens the file by absolute path in the editor', async () => {
      const script = test_script(workspace.file_path('script.js'))
      const test_path = workspace.file_path('test.txt')
      script.writes({name: 'files.open', args: { file_path: test_path }})
      script.reads({success: true, result: undefined})
      await script.test()
      expect(vscode.window.activeTextEditor?.document.uri.fsPath).toBe(test_path)

    })
  
    it('switches to the file in the editor if already open', async function () {
      const index_path = workspace.file_path('index.ts')
      const test_path = workspace.file_path('test.txt')

      let script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'files.open', args: { file_path: test_path }})
      script.writes({name: 'files.open', args: { file_path: index_path }})
      script.reads({success: true, result: undefined})
      script.reads({success: true, result: undefined})
      await script.test()
      expect(vscode.window.activeTextEditor?.document.uri.fsPath).toBe(index_path)
  
      script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'files.open', args: { file_path: test_path }})
      script.reads({success: true, result: undefined})
      await script.test()
      expect(vscode.window.activeTextEditor?.document.uri.fsPath).toBe(test_path)
    })
  
    it(`shows an error notification if the file doesn't exist`, async () => {
      const nonexistent = workspace.file_path('nonexistent.txt')
      const script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'files.open', args: { file_path: nonexistent }})
      const {received_stdin_lines} = await script.run()
      expect(vscode.window.activeTextEditor?.document.uri.fsPath).toBe(undefined)
      expect(received_stdin_lines).toHaveLength(1)
      const res = JSON.parse(received_stdin_lines[0])
      expect(res).toEqual({success: false, error: expect.stringContaining(`Unable to resolve nonexistent file '${nonexistent}'`)})
    })
  })

  suite('command: inputs.select', () => {
    const suggestions = [
      { label: 'Apple', description: 'A fruit' },
      { label: 'Berry', description: 'Another fruit' },
    ]
    it('passes title and placeholder options to vscode.window.showQuickPick and returns the selected items', async () => {
      let script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'inputs.select', args: { title: 'My Title', placeholder: 'Pick one', choices: suggestions }})
      script.reads({success: true, result: [suggestions[0]]})
      quick_pick.add_result(suggestions[0])
      await script.test()
      expect(quick_pick.get_args()).toMatchObject([{
        title: 'My Title',
        canPickMany: false,
        placeHolder: 'Pick one',
        suggestions,
      }])
      quick_pick.clear()

      script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'inputs.select', args: { title: 'My Other Title', multiple: true, choices: suggestions }})
      script.reads({success: true, result: suggestions})
      quick_pick.add_result(suggestions)
      await script.test()
      expect(quick_pick.get_args()).toMatchObject([{
        title: 'My Other Title',
        canPickMany: true,
        placeHolder: undefined,
        suggestions,
      }])
    })

    it('returns an empty array if the quick pick is cancelled (no selection)', async () => {
      const script = test_script(workspace.file_path('script.js'))
      script.writes({name: 'inputs.select', args: { title: 'My Title', placeholder: 'Pick one', choices: suggestions }})
      quick_pick.add_result(undefined as any)
      script.reads({success: true, result: []})
      await script.test()
    })
  })
})
