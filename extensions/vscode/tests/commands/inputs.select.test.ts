import expect from 'expect'
import * as vscode from 'vscode'
import { suite, it, beforeEach } from 'mocha'
import {quick_pick, editor, workspace, notifications} from '../utils'

// suite('command: jisr.inputs.select', () => {
//   const suggestions = [
//     { label: 'Apple', description: 'A fruit' },
//     { label: 'Berry', description: 'Another fruit' },
//   ]
//   beforeEach(async () => {
//     await workspace.create_files({ 'file.txt': `The chosen fruits are: . That's all.` })
//     await editor.open_file('file.txt')
//     editor.move_cursor(1, `The chosen fruits are: `.length + 1)
//   })

//   it('passes title and placeholder options to vscode.window.showQuickPick', async () => {
//     await vscode.commands.executeCommand('jisr.inputs.select', {
//       title: 'My Title',
//       placeholder: 'Pick one',
//       suggestions,
//     })
//     expect(quick_pick.get_args()).toMatchObject([{
//       title: 'My Title',
//       canPickMany: false,
//       placeHolder: 'Pick one',
//       suggestions,
//     }])

//     quick_pick.clear()
//     await vscode.commands.executeCommand('jisr.inputs.select', {
//       title: 'My Other Title',
//       multiple: true,
//       suggestions,
//     })
//     expect(quick_pick.get_args()).toMatchObject([{
//       title: 'My Other Title',
//       canPickMany: true,
//       placeHolder: undefined,
//       suggestions,
//     }])
//   })

//   it('inserts the selected item label into the active editor when a single option is chosen', async () => {
//     quick_pick.add_result({ label: 'Apple' })
//     await vscode.commands.executeCommand('jisr.inputs.select', { suggestions })
//     expect(editor.get_content()).toBe(`The chosen fruits are: Apple. That's all.`)
//   })

//   it('joins multiple selected item labels with default ", " separator when multiple=true', async () => {
//     quick_pick.add_result([{ label: 'Apple' }, { label: 'Berry' }])
//     await vscode.commands.executeCommand('jisr.inputs.select', { multiple: true, suggestions })
//     expect(editor.get_content()).toBe(`The chosen fruits are: Apple, Berry. That's all.`)
//   })

//   it('joins multiple selected item labels with the provided insertion_separator when specified', async () => {
//     quick_pick.add_result([{ label: 'Apple' }, { label: 'Berry' }])
//     await vscode.commands.executeCommand('jisr.inputs.select', { multiple: true, insertion_separator: ' | ', suggestions })
//     expect(editor.get_content()).toBe(`The chosen fruits are: Apple | Berry. That's all.`)
//   })

//   it('does nothing if the quick pick is cancelled (no selection)', async () => {
//     quick_pick.add_result(undefined as any)
//     await vscode.commands.executeCommand('jisr.inputs.select', { suggestions })
//     expect(editor.get_content()).toBe(`The chosen fruits are: . That's all.`)
//   })

//   it('does nothing if there is no active text editor', async () => {
//     await editor.close_all()
//     await vscode.commands.executeCommand('jisr.inputs.select', { suggestions })
//     expect(notifications.get()).toEqual([])
//     await editor.open_file('file.txt')
//     expect(editor.get_content()).toBe(`The chosen fruits are: . That's all.`)
//   })
// })