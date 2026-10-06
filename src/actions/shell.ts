// Quoted for the shell, so a name can never be read as anything but one argument.
export const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

// "container web" for one, "3 containers" for more.
export const describeItems = (noun: string, names: readonly string[]) =>
  names.length === 1 ? `${noun} ${names[0]}` : `${names.length} ${noun}s`;

// `docker <command> <targets>`, the targets quoted; nothing to run when there are no targets.
export const dockerScript = (command: string, targets: readonly string[]) =>
  targets.length > 0 ? `docker ${command} ${targets.map(shellQuote).join(" ")}` : "";
