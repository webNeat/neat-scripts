const defaults = {
  stdin: async () => {
    let content = ''
    await process.stdin.forEach((text) => {
      content += text.toString()
    })
    return content
  },
  stdout: (text: string) => process.stdout.write(text),
}
export type Env = typeof defaults
export const { env, setEnv, resetEnv } = createEnv(defaults)

function createEnv<T extends Record<string, (...args: any[]) => any>>(defaults: T) {
  let overrides: Partial<T> = {}
  const setEnv = (custom: Partial<T>) => {
    Object.assign(overrides, custom)
  }
  const resetEnv = () => {
    overrides = {}
  }
  const env = {} as T
  for (const name of Object.keys(defaults)) {
    env[name as keyof T] = ((...args) => overrides[name]?.(...args) ?? defaults[name](...args)) as any
  }
  return { env, setEnv, resetEnv }
}
