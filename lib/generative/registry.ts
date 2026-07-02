import { GenerativeExecutor } from "./types";
import { allGenerativeExecutors } from "./executors";

class ExecutorRegistry {
  private executors: Map<string, GenerativeExecutor> = new Map();

  register(executor: GenerativeExecutor) {
    this.executors.set(executor.sku, executor);
  }

  get(sku: string): GenerativeExecutor | undefined {
    return this.executors.get(sku);
  }

  has(sku: string): boolean {
    return this.executors.has(sku);
  }
}

export const generativeRegistry = new ExecutorRegistry();

// Auto-register all executors
allGenerativeExecutors.forEach(executor => {
  generativeRegistry.register(executor);
});
