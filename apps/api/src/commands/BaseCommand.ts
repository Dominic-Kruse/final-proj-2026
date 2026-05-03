// ── Base Command Interface ─────────────────────────────────────────────────────
// All commands must implement this contract.
// TResult is the shape of the resolved value from execute().
export interface Command<TResult> {
  execute(): Promise<TResult>;
}

// ── CommandInvoker ─────────────────────────────────────────────────────────────
// Single place to run any command. Centralises timing, logging, and error
// re-throw so controllers stay thin.
export class CommandInvoker {
  async run<TResult>(command: Command<TResult>): Promise<TResult> {
    const commandName = command.constructor.name;
    const start = Date.now();

    try {
      const result = await command.execute();
      console.info(`[CommandInvoker] ${commandName} completed in ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.error(`[CommandInvoker] ${commandName} failed after ${Date.now() - start}ms:`, error);
      throw error;
    }
  }
}

// Singleton — import this everywhere instead of instantiating per-request
export const commandInvoker = new CommandInvoker();