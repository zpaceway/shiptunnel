import { Command } from "commander";
import { OptionalString, TClientOptions, TServerOptions } from "./types";
import { ShiptunnelServer } from "./server";
import { ShiptunnelClientManager } from "./client/manager";
import crypto from "crypto";
import logger from "./logger";

const program = new Command();

program
  .name("shiptunnel-cli-tool")
  .description("Shiptunnel CLI tool")
  .version("1.0.0");

program
  .command("client")
  .description(
    "Run the client with the specified server and forwarding parameters"
  )
  .option("--skey <server-key>", "The server key")
  .option("--shost <server-host>", "The server host")
  .option("--sport <server-port>", "The server port")
  .option("--fport <forwarded-port>", "The forwarded port")
  .option("--fhost <forwarded-host>", "The forwarded host")
  .option("--psize <pool-size>", "The connection pool size")
  .action((options: OptionalString<TClientOptions>) => {
    const managerOptions: TClientOptions = {
      fhost: options.fhost || "localhost",
      fport: parseInt(options.fport || "8080"),
      psize: parseInt(options.psize || "5"),
      shost:
        options.shost ||
        `${crypto.randomUUID().split("-")[0]}.shiptunnel.zpaceway.com`,
      sport: parseInt(options.sport || "3333"),
      skey: options.skey || "43942ad8e78e446b9422550c84431f2f",
    };

    logger.log("Running client with the following parameters:", managerOptions);

    const manager = new ShiptunnelClientManager(managerOptions);
    manager.run();
  });

program
  .command("server")
  .description(
    "Run the client with the specified server and forwarding parameters"
  )
  .option("--skey <server-key>", "The server key")
  .option("--sport <server-port>", "The server port")
  .option("--stimeout <server-timeout>", "The server timeout")
  .action((options: OptionalString<TServerOptions>) => {
    const serverOptions: TServerOptions = {
      skey: options.skey || "43942ad8e78e446b9422550c84431f2f",
      sport: parseInt(options.sport || "3333"),
      stimeout: parseInt(options.stimeout || "1000"),
    };

    logger.log("Running server with the following parameters:", serverOptions);

    const server = new ShiptunnelServer({ options: serverOptions });
    server.listen();
  });

program.parse(process.argv);
