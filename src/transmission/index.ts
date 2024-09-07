import { CallbackQueueOptions } from "./types";

export class CallbackQueue {
  callbacks: (() => Promise<void> | void)[];
  running: boolean;
  delay: number;

  constructor({ delay }: CallbackQueueOptions) {
    this.callbacks = [];
    this.running = false;
    this.delay = delay;
  }

  push(callback: CallbackQueue["callbacks"][number]) {
    this.callbacks.push(callback);
    if (!this.running) {
      this.run();
    }
  }

  async run() {
    this.running = true;
    await new Promise((res) => setTimeout(res, this.delay));
    const callback = this.callbacks.pop();
    if (!callback) {
      this.running = false;
      return;
    }
    try {
      await callback();
    } catch (error) {
    } finally {
      await this.run();
    }
  }
}
