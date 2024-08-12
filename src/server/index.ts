import net from "net";
import {
  generateHttp500responseMessage,
  generateNewClientMessage,
  parseIncommingData,
  SHIPTUNNEL_CLIENT_CONNECT_MESSAGE,
} from "../communication";
import { TServerOptions, TSocket } from "../types";
import logger from "../logger";
import { Subject } from "rxjs";

export class ShiptunnelServer {
  private server: net.Server;
  private options: TServerOptions;
  private clients: Record<string, TSocket[]> = {};
  private availableClient$: Subject<void> = new Subject();

  constructor({ options }: { options: TServerOptions }) {
    this.options = options;
    this.server = net.createServer(
      { allowHalfOpen: true },
      (socket: TSocket) => {
        socket.on("data", (data) => this.handleIncommingData(socket, data));
        socket.on("close", () => this.handleDisconnection(socket));
        socket.on("end", () => this.handleDisconnection(socket));
        socket.on("error", () => this.handleDisconnection(socket));
      }
    );
  }

  handleIncommingData = async (socket: TSocket, incommingData: Buffer) => {
    const data = incommingData.toString();

    if (data === "pong") {
      socket.lastPongAt = new Date();
      socket.shouldSendPing = true;
      return socket.write("ping");
    }

    const { domain, shiptunnelKey, shiptunnelMessage } =
      parseIncommingData(data);

    socket.shiptunnelDomain = socket.shiptunnelDomain || domain;

    if (!socket.shiptunnelDomain) {
      socket.write(generateHttp500responseMessage());
      return socket.end();
    }

    if (
      shiptunnelKey === this.options.skey &&
      shiptunnelMessage === SHIPTUNNEL_CLIENT_CONNECT_MESSAGE
    ) {
      return this.addClient(socket);
    }

    if (socket.incommingSocket) {
      logger.log(`Sending data to incomming socket`);
      socket.incommingSocket.write(incommingData);
      logger.log("Data successfully sent to the incomming socket");
      return;
    }

    const forwardedSocket =
      socket.forwardedSocket ||
      (await this.findAvailableClient(socket.shiptunnelDomain));

    if (!forwardedSocket) return socket.end();

    forwardedSocket.incommingSocket = socket;
    socket.forwardedSocket = forwardedSocket;
    logger.log("Sending data to socket forwarded socket");

    forwardedSocket.write(incommingData, (err) => {
      if (!err) return;
      logger.log(`Failed to send data ${err}`);
    });
  };

  handleDisconnection = (socket: TSocket) => {
    const client = this.findClient(socket);
    if (client) {
      this.removeClient(client);
      return logger.log("Client disconnected");
    }

    if (socket.forwardedSocket) {
      logger.log("Disconneting incomming socket from forwarded socket");
      socket.forwardedSocket.incommingSocket?.end();
      socket.forwardedSocket.incommingSocket = undefined;
      socket.forwardedSocket = undefined;
    }
  };

  listen = () => {
    this.server.listen(this.options.sport, () => {
      logger.log(`Shiptunnel server running at port ${this.options.sport}`);
    });
  };

  findClient = (client: TSocket) => {
    if (!client.shiptunnelDomain) return undefined;
    return this.clients[client.shiptunnelDomain]?.find(
      (_client) => client === _client
    );
  };

  findAvailableClient = async (domain: string) => {
    logger.log(
      `Trying to find available client to handle incomming request to ${domain}...`
    );
    const client = this.clients[domain]?.find(
      (client) => !client.incommingSocket
    );

    if (!client) {
      logger.log(`No available client for ${domain} was found`);
      this.askForNewClient(domain);
      return new Promise<TSocket | undefined>((res, rej) => {
        const timeout = setTimeout(() => rej(undefined), this.options.stimeout);
        this.availableClient$.subscribe({
          next: () => {
            const client = this.clients[domain]?.find(
              (client) => !client.incommingSocket
            );
            if (!client) return;
            clearTimeout(timeout);
            res(client);
          },
        });
      });
    }

    logger.log(`Available client for ${domain} found`);

    return client;
  };

  removeClient = (client: TSocket) => {
    if (!client.shiptunnelDomain) return;
    this.clients[client.shiptunnelDomain] = (
      this.clients[client.shiptunnelDomain] || []
    ).filter((_client) => _client === client);
  };

  addClient = (client: TSocket) => {
    if (!client.shiptunnelDomain)
      return logger.log("Can not add client because no domain was found");
    logger.log(`Adding new client to ${client.shiptunnelDomain}`);
    client.shouldSendPing = true;
    client.lastPongAt = new Date();
    setInterval(() => {
      const fiveMinAgo = new Date();
      fiveMinAgo.setTime(fiveMinAgo.getTime() - 1000 * 60 * 1);
      if (client.lastPongAt && client.lastPongAt < fiveMinAgo) {
        client.end();
      }
      if (!client.shouldSendPing) {
        return;
      }
      client.write("ping");
    }, 5000);
    this.clients[client.shiptunnelDomain] = [
      ...(this.clients[client.shiptunnelDomain] || []),
      client,
    ];
    logger.log(
      `New client connected, currently available clients ${
        this.clients[client.shiptunnelDomain]?.length || 0
      }`
    );
  };

  askForNewClient = (domain: string) => {
    logger.log(`Trying to ask clients for ${domain} to create new connections`);
    this.clients[domain] = this.clients[domain] || [];
    const clients = this.clients[domain];
    const clientIndex = (Math.random() * clients.length) | 0;
    clients[clientIndex]?.write(
      generateNewClientMessage(domain, this.options.skey)
    );
  };
}
