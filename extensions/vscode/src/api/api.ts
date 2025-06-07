import {CommandName, CommandFns, CommandRequest, CommandResponse} from "../interfaces";

const fns = {} as CommandFns;

export function define<K extends CommandName>(name: K, fn: CommandFns[K]) {
  fns[name] = fn
}

export async function execute<K extends CommandName>(request: CommandRequest<K>): Promise<CommandResponse<K>> {
  const fn = fns[request.name]
  if (!fn) return { success: false, error: `Command ${request.name} not found` }
  try {
    return { success: true, result: await fn(request.args) }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
