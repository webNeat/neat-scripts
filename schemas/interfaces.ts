/**
 * Shared Typescript interfaces for the context and commands.
 * Should only be changed in `schemas/interfaces.ts`
 */

export interface Position {
  line: number;
  col: number;
}

export interface Selection {
  start: Position;
  end: Position;
}

export interface Context {
  workspace_path: string;
  file_path: string;
  selections: Selection[];
}

export type SelectChoice = { label: string; description?: string }

export interface Commands {
  "context": {
    input: {};
    output: Context
  };
  "files.open": {
    input: { file_path: string };
    output: void
  };
  "notifications.info": {
    input: { message: string };
    output: void
  };
  "notifications.warning": {
    input: { message: string };
    output: void
  };
  "notifications.error": {
    input: { message: string };
    output: void
  };
  "inputs.select": {
    input: {
      title?: string;
      multiple?: boolean;
      placeholder?: string;
      choices: SelectChoice[] | string[];
    };
    output: SelectChoice[];
  };
}

export type CommandName = keyof Commands
export type CommandInput<K extends CommandName> = Commands[K]['input']
export type CommandOutput<K extends CommandName> = Commands[K]['output']
export type CommandFns = {
  [K in CommandName]: (input: CommandInput<K>) => Promise<CommandOutput<K>>
}
export type CommandRequest<K extends CommandName> = {
  name: K
  args: CommandInput<K>
}
export type CommandResponse<K extends CommandName> =
  | { success: true; result: CommandOutput<K> }
  | { success: false; error: string }