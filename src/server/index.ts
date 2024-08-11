import net from "net";
import {
  generateHttp500responseMessage,
  generateNewClientMessage,
  parseIncommingData,
  SHIPTUNNEL_CLIENT_CONNECT_MESSAGE,
} from "../communication";
import { TServerOptions, TSocket } from "../types";

export class ShiptunnelServer {
  private server: net.Server;
  private options: TServerOptions;
  private clients: Record<string, TSocket[]> = {};

  constructor({ options }: { options: TServerOptions }) {
    this.options = options;
    this.server = net.createServer((socket: TSocket) => {
      socket.on("data", (data) => this.handleIncommingData(socket, data));
      socket.on("close", () => this.handleDisconnection(socket));
      socket.on("end", () => this.handleDisconnection(socket));
      socket.on("error", () => this.handleDisconnection(socket));
    });
  }

  handleIncommingData = (socket: TSocket, incommingData: Buffer) => {
    const { domain, shiptunnelKey, shiptunnelMessage } =
      parseIncommingData(incommingData);

    if (!domain) {
      socket.write(generateHttp500responseMessage());
      return socket.end();
    }

    socket.shiptunnelDomain = domain;

    if (
      shiptunnelKey === this.options.skey &&
      shiptunnelMessage === SHIPTUNNEL_CLIENT_CONNECT_MESSAGE
    ) {
      return this.addClient(socket);
    }

    if (socket.incommingSocket) {
      console.log(`Sending data to incomming socket`);
      socket.incommingSocket.write(incommingData);
      console.log("Data successfully sent to the incomming socket");
      return;
    }

    const forwardedSocket =
      socket.forwardedSocket || this.findAvailableClient(domain);

    if (!forwardedSocket) {
      console.log("No available socket was found to handle request");
      socket.end();

      return;
    }

    forwardedSocket.incommingSocket = socket;
    socket.forwardedSocket = forwardedSocket;
    console.log("Sending data to socket forwarded socket");
    forwardedSocket.write(incommingData);
  };

  handleDisconnection = (socket: TSocket) => {
    socket.forwardedSocket?.end();
    const forwardedSocket = this.findSocket(socket);
    if (forwardedSocket) {
      this.removeClient(forwardedSocket);
      return console.log("Client disconnected");
    }

    if (socket.forwardedSocket) {
      console.log("Disconneting incomming socket from forwarded socket");
      socket.forwardedSocket.incommingSocket?.end();
      socket.forwardedSocket.incommingSocket = undefined;
      socket.forwardedSocket = undefined;
    }
  };

  listen = () => {
    this.server.listen(this.options.sport, () => {
      console.log(
        `Shiptunnel server running at port ${this.options.sport}\n\n`
      );
    });
  };

  findSocket = (socket: TSocket) => {
    if (!socket.shiptunnelDomain) return undefined;
    return this.clients[socket.shiptunnelDomain]?.find(
      (_socket) => socket === _socket
    );
  };

  findAvailableClient = (domain: string) => {
    console.log(
      `Trying to find available client to handle incomming request to ${domain}...`
    );
    const client = this.clients[domain]?.find(
      (client) => !client.incommingSocket
    );

    if (!client) this.askForNewClient(domain);

    return client;
  };

  removeClient = (client: TSocket) => {
    if (!client.shiptunnelDomain) return;
    this.clients[client.shiptunnelDomain] = (
      this.clients[client.shiptunnelDomain] || []
    ).filter((_client) => client !== _client);
  };

  addClient = (client: TSocket) => {
    if (!client.shiptunnelDomain)
      return console.log("Can not add client because no domain was found");
    console.log(`Adding new client to ${client.shiptunnelDomain}`);
    this.clients[client.shiptunnelDomain] = [
      ...(this.clients[client.shiptunnelDomain] || []),
      client,
    ];
    console.log(`New client connected`);
  };

  askForNewClient = (domain: string) => {
    console.log(
      `Trying to ask clients for ${domain} to create new connections`
    );
    this.clients[domain] = this.clients[domain] || [];
    const clients = this.clients[domain];
    const clientIndex = (Math.random() * clients.length) | 0;
    clients[clientIndex]?.write(
      generateNewClientMessage(domain, this.options.skey)
    );
  };
}
