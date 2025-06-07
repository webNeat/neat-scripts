import { env } from './env'
import { Context, Commands } from './interfaces'

let contextPromise: Promise<Context> | undefined

export { setEnv, resetEnv } from './env'

export function context(): Promise<Context> {
  if (contextPromise === undefined) {
    contextPromise = (async () => {
      command('context', {})
      const response = JSON.parse(await env.stdin())
      if (response.success) {
        return response.result
      } else {
        return Promise.reject(response.error)
      }
    })()
  }
  return contextPromise
}

export function command<K extends keyof Commands>(name: K, args: Commands[K]['input']) {
  env.stdout(JSON.stringify({ name, args }))
}
