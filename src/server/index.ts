import net from "net";
import {
  generateNewClientMessage,
  parseIncommingData,
  SHIPTUNNEL_CLIENT_CONNECT_MESSAGE,
} from "../communication";
import { TServerOptions, TShiptunnelSocket } from "../types";
import logger from "../logger";
import { Subject } from "rxjs";

export class ShiptunnelServer {
  private server: net.Server;
  private options: TServerOptions;
  private clients: Record<string, TShiptunnelSocket[]> = {};
  private availableClient$: Subject<void> = new Subject();

  constructor({ options }: { options: TServerOptions }) {
    this.options = options;
    this.server = net.createServer(
      { allowHalfOpen: true },
      (socket: TShiptunnelSocket) => {
        socket.on("data", (data) => this.handleIncommingData(socket, data));
        socket.on("close", () => this.handleDisconnection(socket));
        socket.on("end", () => this.handleDisconnection(socket));
        socket.on("error", () => this.handleDisconnection(socket));
      }
    );
  }

  handleIncommingData = async (
    socket: TShiptunnelSocket,
    incommingData: Buffer
  ) => {
    const data = incommingData.toString();

    if (data === "pong" && socket.client) {
      socket.client.lastPongAt = new Date();
      socket.client.shouldSendPing = true;
      return;
    }

    const { domain, shiptunnelKey, shiptunnelMessage } =
      parseIncommingData(data);

    socket.shiptunnelDomain = socket.shiptunnelDomain || domain;

    if (!socket.shiptunnelDomain) {
      return socket.end();
    }

    if (
      shiptunnelKey === this.options.skey &&
      shiptunnelMessage === SHIPTUNNEL_CLIENT_CONNECT_MESSAGE
    ) {
      return this.addClient(socket);
    }

    if (socket.client?.incommingSocket) {
      logger.log(`Sending data to incomming socket`);
      socket.client.incommingSocket?.write(incommingData);
      logger.log("Data successfully sent to the incomming socket");
      return;
    }

    const clientSocket =
      socket.incomming?.forwardedSocket ||
      (await this.findAvailableClient(socket.shiptunnelDomain));

    if (!clientSocket?.client) return socket.end();

    clientSocket.client.incommingSocket = socket;
    socket.incomming = {
      forwardedSocket: clientSocket,
    };
    logger.log("Sending data to socket forwarded socket");

    clientSocket.write(incommingData, (err) => {
      if (!err) return;
      logger.log(`Failed to send data ${err}`);
    });
  };

  handleDisconnection = (socket: TShiptunnelSocket) => {
    const clientSocket = this.findClient(socket);
    if (clientSocket) return this.removeClient(clientSocket);

    if (socket.incomming?.forwardedSocket) {
      logger.log("Disconneting incomming socket from forwarded socket");
      socket.incomming.forwardedSocket.client?.incommingSocket?.end();
      if (socket.incomming.forwardedSocket?.client) {
        socket.incomming.forwardedSocket.client.incommingSocket = undefined;
        socket.incomming.forwardedSocket = undefined;
      }
    }
  };

  listen = () => {
    this.server.listen(this.options.sport, () => {
      logger.log(`Shiptunnel server running at port ${this.options.sport}`);
    });
  };

  findClient = (client: TShiptunnelSocket) => {
    if (!client.shiptunnelDomain) return undefined;
    return this.clients[client.shiptunnelDomain]?.find(
      (_client) => client === _client
    );
  };

  findAvailableClient = async (domain: string) => {
    logger.log(
      `Trying to find available client to handle incomming request to ${domain}...`
    );
    const clientSocket = this.clients[domain]?.find(
      (_socket) => _socket.client && !_socket.client.incommingSocket
    );

    if (!clientSocket) {
      logger.log(`No available client for ${domain} was found`);
      this.askForNewClient(domain);
      return new Promise<TShiptunnelSocket | undefined>((res) => {
        const timeout = setTimeout(() => res(undefined), this.options.stimeout);
        this.availableClient$.subscribe({
          next: () => {
            const clientSocket = this.clients[domain]?.find(
              (_socket) => _socket.client && !_socket.client.incommingSocket
            );
            if (!clientSocket) return;
            clearTimeout(timeout);
            res(clientSocket);
          },
        });
      });
    }

    logger.log(`Available client for ${domain} found`);

    return clientSocket;
  };

  removeClient = (socket: TShiptunnelSocket) => {
    if (!socket.shiptunnelDomain) return;
    socket.end();
    this.clients[socket.shiptunnelDomain] = (
      this.clients[socket.shiptunnelDomain] || []
    ).filter((_socket) => _socket === socket);
    logger.log(
      `Client removed, currently available clients ${
        this.clients[socket.shiptunnelDomain]?.length || 0
      }`
    );
  };

  addClient = (socket: TShiptunnelSocket) => {
    if (!socket.shiptunnelDomain)
      return logger.log("Can not add client because no domain was found");
    logger.log(`Adding new client to ${socket.shiptunnelDomain}`);
    socket.client = { shouldSendPing: true, lastPongAt: new Date() };
    const interval = setInterval(() => {
      const fiveMinAgo = new Date();
      fiveMinAgo.setTime(fiveMinAgo.getTime() - 1000 * 5 * 1);
      if (socket.client?.lastPongAt && socket.client.lastPongAt < fiveMinAgo) {
        this.removeClient(socket);
        clearInterval(interval);
      }
      if (!socket.client?.shouldSendPing) {
        return;
      }
      socket.write("ping");
    }, 1000);
    this.clients[socket.shiptunnelDomain] = [
      ...(this.clients[socket.shiptunnelDomain] || []),
      socket,
    ];
    logger.log(
      `New client connected, currently available clients ${
        this.clients[socket.shiptunnelDomain]?.length || 0
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
