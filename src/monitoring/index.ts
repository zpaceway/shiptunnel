export const logger = {
  log(...args: unknown[]) {
    if (["LOG"].includes(process.env["LOG_LEVEL"] || "ERROR"))
      console.log.apply(this, [new Date(), ...args]);
  },
  error(...args: unknown[]) {
    if (["LOG", "ERROR"].includes(process.env["LOG_LEVEL"] || "ERROR"))
      console.error.apply(this, [new Date(), ...args]);
  },
};
