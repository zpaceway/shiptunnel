import { ShiptunnelClient } from ".";
import logger from "../logger";
import { TClientOptions } from "../types";

export class ShiptunnelClientManager {
  options: TClientOptions;
  private clients: ShiptunnelClient[] = [];

  constructor(options: TClientOptions) {
    this.options = options;
  }

  run = () => {
    for (let i = 0; i < this.options.psize; i++) {
      this.addNewClient();
    }
  };

  checkPoolStatus = () => {
    if (
      this.clients.filter((_client) => !_client.forwardedSocket).length >=
      this.options.psize
    )
      return;

    this.addNewClient();
  };

  disconnect = (client: ShiptunnelClient, reason: string) => {
    this.clients = this.clients.filter((_client) => _client !== client);
    logger.log(
      `Disconnected from server with reason ${reason}, currently managed clients ${this.clients.length}`
    );

    this.checkPoolStatus();
  };

  addNewClient = () => {
    logger.log("Adding new client");
    const shiptunnelClient = new ShiptunnelClient({ manager: this });
    shiptunnelClient.listen();

    this.clients.push(shiptunnelClient);
  };
}
