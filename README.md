# Neat Scripts

A VSCode extension that lets you automate your workflow using external scripts in any programming language.

## How does it work?

- This extension provides a command `neat-scripts.run` that you can use in keybindings to run an external script as follows:
```json
{
  "key": "cmd+shift+m",  // or any shortcut you prefer
  "command": "neat-scripts.run",
  "args": {
    "script": "/absolute/path/to/your-script"
  }
}
```
- The script can be any executable file on your machine (a binary, Python script, ...).
- When the keybinding is pressed, the script is executed and the following JSON context is passed to its stdin:
```json
{
  "workspace_path": "/path/to/your/current/workspace",
  "file": "/path/to/your/current/open/file",
  "selections": [ // list of current selections/cursors
    {
      "start": { "line": 1, "col": 1 },
      "end": { "line": 1, "col": 1 }
    }
  ]
}
```
- The script can read the file, modify it or do anything else you want with the context.
- The script can also write a sequence of VSCode commands, one command as JSON object per line, to stdout and it will be executed by `neat-scripts`. You can use any command on your VSCode instance (default commands, commands added by extensions, ...).
- The `neat-scripts` extension adds [several useful commands](#added-commands) to VSCode.

## Installation

Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=webneat.neat-scripts)

## Quick Example

Let's create a script that evaluates math expressions.

**Usage:**
- Write a math expression on a line like:
```
123 + 456
```
- Hit the shortcut `ctrl+shift+m`.
- The extension computes and adds the result to the line.
```
123 + 456 = 579
```

**Implementation:**

1. Create a script `evaluate.py`, I am using Python but you can use any language you want.

```python
#!/usr/bin/env python3
import json
import sys

context = json.load(sys.stdin)
selection = context['selections'][0]
line_num = selection['start']['line']

lines = open(context['file'], 'r').readlines()
for selection in context['selections']:
  line_index = selection['start']['line'] - 1
  result = eval(lines[line_index].strip())
  lines[line_index] = f"{lines[line_index]} = {result}"

open(context['file'], 'w').writelines(lines)
```

2. Add keybindings:

```json
{
  "key": "cmd+alt+m",
  "command": "neat-scripts.run",
  "args": {
    "script": "/absolute/path/to/evaluate.py"
  }
}
```

3. That's it! Try it out!

## Added Commands

**neat-scripts.run:** Run an external script on the current file.
```json
{
  "command": "neat-scripts.run",
  "args": {
    "script": "/absolute/path/to/your/script",
    "args": ["arg1", "arg2"] // optional arguments to pass to the script
  }
}
```

**neat-scripts.files.open:** Open (or create) a file by path.
```json
{
  "command": "neat-scripts.files.open",
  "args": {
    "path": "/absolute/path/to/your/file"
  }
}
```

**neat-scripts.notifications.info, neat-scripts.notifications.warning, neat-scripts.notifications.error:** Show info, warning or error notification.
```json
{
  "command": "neat-scripts.notifications.info",
  "args": { "message": "Hello World!" }
}
```

```json
{
  "command": "neat-scripts.notifications.warning",
  "args": { "message": "Hello World!" }
}
```

```json
{
  "command": "neat-scripts.notifications.error",
  "args": { "message": "Hello World!" }
}
```

**neat-scripts.completions.show:** Show a list of suggestions to choose from.
```json
{
  "command": "neat-scripts.completions.show",
  "args": {
    "title": "Title of the list", // optional
    "multiple": true, // optional, allow to select multiple items
    "suggestions": [
      {
        "label": "Hello World!",
        "description": "it all starts here" // optional description to be shown with the item
      },
      { "label": "foo" },
      { "label": "some text" }
    ]
  }
}
```
- When the user chooses the items, their labels are inserted at the current cursor position, separated by `, `.

