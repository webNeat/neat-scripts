# How I created a VSCode extension to automate things with external scripts

## Problem 1: Open File

it all started when I wanted to use VSCode to handle my tasks, I use [Todo+](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-todo-plus) which is great. But at some point, I wanted to split tasks into multiple files and I needed a way to navigate between them easily. So I would have something like:

```
project-42/
  index.todo
  add-features.todo
  add-tests.todo
```

the `index.todo` would contain

```
☐ create the project
☐ add-features.todo
☐ add-tests.todo
☐ make the PR
```

and the `add-features.todo` and `add-tests.todo` would contain some subtasks.

> TDD guy: actually you should group each feature with its tests and write the tests then implement the feature ...
> Response: Yes, I know, it's just an example to illustrate the separation of tasks into multiple files.

I wanted a way to open the `add-features.todo` and `add-tests.todo` simply by placing the caret inside them and hitting a keybinding.

## Solution 1

I found an extension called [Open file](https://marketplace.visualstudio.com/items?itemName=Fr43nk.seito-openfile) that does what I need.
After installing it, I could open the file under the cursor using `alt+p` (I could of course remap the command to any other keybinding).

## Problem 2: Create file if missing then open it

if the file doesn't exist, I want the command to create it automatically.

The [Open file](https://marketplace.visualstudio.com/items?itemName=Fr43nk.seito-openfile) doesn't support that so I need another way. Basically, when I press the keybinding, I want to execute the following commands:
1. create the file if missing
2. open the file

I found the [Multi Command](https://marketplace.visualstudio.com/items?itemName=ryuta46.multi-command) extension that can execute a sequence of commands. But I couldn't find a command or an extension that would create the relative file if missing without requiring any interaction/confirmation from me.

So, inspired by the JS ecosystem where everyone creates their own library/framework, I decided to create my own VSCode extension.

## Problem 3: Create an extension to automate VSCode

The initial goal was to create a simple extension that creates the file under cursor then opens it. But I ended up creating a sort of framework that let's you automate VSCode using external scripts written with any language. Here is my journey step by step:

### Step 1: Setup the project

```sh
npm install -g yo # install yoman globally
npm install -g generator-code # install the VSCode extensions generator globally
```

Then I run `yo code` and chose:
```
What type of extension do you want to create? New Extension (TypeScript)
What's the name of your extension? Create and open file
What's the identifier of your extension? create-and-open-file
What's the description of your extension? Create the relative file under the cursor if missing then opens it
Initialize a git repository? Yes
Bundle the source code with webpack? No
Which package manager to use? npm
```

Then I opened `package.json` of the generated project and modified the `contributions` section to be as follows:
```js
{
  ...
  "contributes": {
    "commands": [
      {
        "command": "create-and-open-file.run",
        "title": "Create the relative file under the cursor if missing then opens it"
      }
    ]
  },
}
```

This tells VSCode that the extension adds the command `create-and-open-file.run`.

Next I opened the `src/extension.ts` and clears it to be as follows:

```ts
import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
  // runs when the extension is activated
}

export function deactivate() {
  // runs when the extension is deactivated
}
```
Yes, basically an extension consists of two functions `activate` and `deactivate`. Most of the logic goes inside the `activate` function, which I will fill in the following steps.

### Step 2: Implement the `create-and-open-file.run` command

Now all I needed to do is to implement the command in the `src/extension.ts` file as follows:

```ts
import * as vscode from "vscode"

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("create-and-open-file.run", async () => {
    const editor = vscode.window.activeTextEditor // get current open tab
    if (!editor) return // if no current tab, do nothing
    const [line, position] = getLineAndPosition(editor) // get current line and position
    let filePath = extractFilePath(line, position) // extract the path under the cursor
    if (!filePath) return // if no path, do nothing
    filePath = normalizeRelativePath(editor, filePath)
    await createFileIfNotExists(filePath)
    await openFile(filePath)
  })
  context.subscriptions.push(disposable)
}

// implementation of functions `getLineAndPosition`, `extractFilePath`, `normalizeRelativePath`, `createFileIfNotExists` and `openFile` ...
```

That's it, now I could press `F5` and try my extension. It's working!

### Step 3: Design a more generic extension

So far, I had a working solution for my initial problem, but other ideas started appearing in my mind:
- A command to list all pending tasks with certain tag.
- A command to print the tree of task files with progress and remaining time for each file.
- A command to show all tasks scheduled for today.
...


I wanted a way to be able to create these commands and any similar ones without having to create a whole new extension each time. After a bit of thinking, I found the following solution: **Create an extension that can run any external script, give it the current context (the current file, the position/selection, ...) and execute the VSCode commands that are returned by the script**. Let me explain the idea in more details:
- The extension would add a command `scripts.run` to VSCode.
- I can use that command to define keybindings like:
```json
[
  // ...
  {
    "key": "alt+o",
    "command": "scripts.run",
    "args": {
      "script": "/path/to/my/executable/script"
    }
  }
]
```
- When `alt+o` is pressed, the extension will run `/path/to/my/executable/script` and give it the following JSON in the standard input
```json
{
  "file": "/absolute/path/to/current/file",
  "position": {
    "line": 10,
    "col": 5
  }
}
```
- The script does anything (reads the file, creates new files, changes the content of some file, ...)
- The script should output a JSON array of VSCode commands to the standard output. For example:
```json
[
  { 
    "command": "type",
    "args": {
      "text": "Hello From the external script!"
    }
  }
]
```
- The extension waits for the script to finish executing, parses the stdout and runs the returned commands.

So in this example, pressing `alt+o` would type `Hello From the external script!` in the current position.

### Step 4: Implement the generic extension

I started by updating the name and description of the extension in `package.json`, then I renamed the `create-and-open-file.run` command as `scripts.run`. Then I updated the implementation as follows:

```ts
import * as vscode from 'vscode'
import * as commands from './commands'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('scripts.run', commands.run))
}

export function deactivate() {}
```

And created the file `src/commands/run.ts` that contains the implementation of the `scripts.run` command:
```ts
import * as vscode from 'vscode'
import { exec } from '../utils'

export async function run(args: {script: string}) {
  try {
    const stdout = await exec(args.script, JSON.stringify(getContext()))
    for (const command of JSON.parse(stdout)) {
      await runCommand(command)
    }
  } catch (e) {
    console.error(`Error: ${e}`)
  }
}

// implementation of `getContext` and `runCommand` ...
```

### Step 5: Test the extension with a simple script

To test this implementation, I wrote the following Python script that should duplicate the current line (Why Python? for no reason, I could have chosen any other language):
```py
import json
import sys

context = json.load(sys.stdin)
file = open(context['file'], 'r')
line = file.readlines()[context['position']['line'] - 1]
print(json.dumps([
  "cursorLineEnd",
  {'command': 'type', 'args': {'text': '\n' + line}}
]))
```

Then I defined the following keybinding
```json
[
  // ...
  {
    "key": "alt+d",
    "command": "scripts.run",
    "args": {
      "script": "python3 /path/to/script.py"
    }
  }
]
```

I run the extension and pressed `alt+d` and the line is duplicated :D

## Step 6: Handle selections and multi cursors

So far, I am passing a single cursor position to the script. What if there is a selection? I changed the context type to pass the start and the end of the selection (if there is no selection, then the start and the end will be equal):
```ts
type Context = {
  file: string
  selection: {
    start: {line: number, col: number},
    end: {line: number, col: number}
  }
}
```

Then to support the case of multiple selections:
```ts
type Context = {
  file: string
  selections: Array<{
    start: {line: number, col: number},
    end: {line: number, col: number}
  }>
}
```

## Step 7: Solve the initial problem

At this point, I was happy with the result and wanted to use it to solve my initial problem: Open the file under cursor (creating it if missing). So I wrote the following script (I used Javascript this time):

```js
async function main() {
  const { file, selections } = JSON.parse(await stdin())
  const position = selections[0].start // get the first cursor position
  const line = await readLine(file, position.line)
  let filename = extractPath(line, position.col)
  if (!filename) return '[]'
  await ensureFileExists(filename)
  return JSON.stringify(['seito-openfile.openFileFromText'])
}
main().then(console.log).catch(console.error)

// implementations of stdin, readLine, extractPath, ensureFileExists, ...
```

This worked well, but I noticed something: I was using the command `seito-openfile.openFileFromText` from the [Open file](https://marketplace.visualstudio.com/items?itemName=Fr43nk.seito-openfile) extension, which has two cons:
- For my script to work, I need that extension to be installed.
- The `seito-openfile.openFileFromText` doesn't support specifying the file path programmatically (pass it as argument), it always uses the string under the cursor.

It was time for me to create some custom commands that I would need in my scripts and include them in the extension. Starting with `scripts.files.open`.

## Step 8: Add the `scripts.files.open` command

I created a new file `src/commands/files/open.ts`

```ts
import * as vscode from 'vscode'

export async function open(args: {path: string}) {
  try {
    const document = await vscode.workspace.openTextDocument(args.path)
    await vscode.window.showTextDocument(document)
  } catch (e) {
    vscode.window.showErrorMessage(`Could not open file at '${args.path}': ${e}`)
  }
}
```

Then registered the command in `src/extension.ts`

```ts
import * as vscode from 'vscode'
import * as commands from './commands'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('scripts.run', commands.run))
  context.subscriptions.push(vscode.commands.registerCommand('scripts.files.open', commands.files.open))
}

export function deactivate() {}
```

## Step 9: Publish the extension

...