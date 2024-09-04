export const logger = {
  log(...args: unknown[]) {
    console.log.apply(this, [new Date(), ...args]);
  },
  error(...args: unknown[]) {
    console.error.apply(this, [...args]);
  },
};
