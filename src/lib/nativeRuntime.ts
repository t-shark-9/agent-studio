export type DesktopCommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

const isWindowDefined = typeof window !== 'undefined';

export function isTauriDesktop(): boolean {
  return isWindowDefined && '__TAURI_INTERNALS__' in window;
}

export async function runDesktopCommand(command: string, args: string[] = []): Promise<DesktopCommandResult> {
  if (!isTauriDesktop()) {
    throw new Error('Desktop command execution is only available in the downloadable desktop app.');
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<DesktopCommandResult>('run_terminal_command', { command, args });
}
