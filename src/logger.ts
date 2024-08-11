class Logger {
  log(...args: unknown[]) {
    console.log.apply(this, [new Date(), ...args]);
  }
}

export default new Logger();
