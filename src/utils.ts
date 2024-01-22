import * as childProcess from 'child_process'

export async function exec(command: string, stdin = '') {
  return new Promise<string>((resolve, reject) => {
    const child = childProcess.exec(command, (error, stdout, stderr) => {
      if (error) return reject(error)
      if (stderr) return reject(stderr)
      resolve(stdout)
    })
    child.stdin!.write(stdin)
    child.stdin!.end()
  })
}
