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

  handleDisconnect = (client: ShiptunnelClient) => {
    logger.log("Disconnected from server");
    this.clients = this.clients.filter((_client) => _client !== client);

    this.checkPoolStatus();
  };

  addNewClient = () => {
    logger.log("Adding new client");
    const shiptunnelClient = new ShiptunnelClient({ manager: this });
    shiptunnelClient.listen();

    this.clients.push(shiptunnelClient);
  };
}
