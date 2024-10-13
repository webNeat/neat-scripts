import * as childProcess from 'child_process'

export function exec(command: string, args: string[], context: string): childProcess.ChildProcess {
  const child = childProcess.spawn(command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  child.stdin!.write(context)
  child.stdin!.end()
  return child
}
