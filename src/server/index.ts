import net from "net";
import { HTTP_END_TEXT, MESSAGES } from "../constants";
import { TServerOptions, TSocket } from "../types";
import { bufferEndsWith } from "../utils";

export class ShiptunnelServer {
  private server: net.Server;
  private options: TServerOptions;
  private sockets: TSocket[] = [];

  constructor({ options }: { options: TServerOptions }) {
    this.options = options;
    this.server = net.createServer((socket: TSocket) => {
      socket.on("data", (data) => this.handleIncommingData(socket, data));
      socket.on("close", () => this.handleDisconnection(socket));
      socket.on("end", () => this.handleDisconnection(socket));
      socket.on("error", () => this.handleDisconnection(socket));
    });
  }

  handleIncommingData = (socket: TSocket, incommingData: Buffer): void => {
    if (incommingData.equals(MESSAGES.SHIPTUNNEL_CONNECT_SERVER)) {
      console.log(`New client connected`);
      this.addSocket(socket);

      return;
    }

    if (socket.incommingSocket) {
      console.log(`Sending data to incomming socket`);
      socket.incommingSocket.write(incommingData);
      if (bufferEndsWith(incommingData, HTTP_END_TEXT)) {
        socket.incommingSocket.end();
        socket.incommingSocket = undefined;
      }

      return;
    }

    const forwardedSocket =
      socket.forwardedSocket || this.findAvailableSocket();

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
    const forwardedSocket = this.findSocket(socket);
    if (forwardedSocket) {
      this.removeSocket(forwardedSocket);
      return console.log("Client disconnected");
    }

    if (socket.forwardedSocket) {
      console.log("Disconneting incomming socket from forwarded socket");
      if (socket.forwardedSocket.incommingSocket && this.sockets.length > 3) {
        socket.forwardedSocket.incommingSocket.end();
      }
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

  findSocket(socket: TSocket) {
    return this.sockets.find((_socket) => socket === _socket);
  }

  findAvailableSocket() {
    console.log(
      "Trying to find available socket to handle incomming request..."
    );
    const socket = this.sockets.find((socket) => !socket.incommingSocket);

    return socket;
  }

  removeSocket(socket: TSocket) {
    this.sockets = this.sockets.filter((_socket) => socket !== _socket);
  }

  addSocket(socket: TSocket) {
    this.sockets = [...this.sockets, socket];
  }

  askForNewSocket() {
    const socketsIndex = (Math.random() * this.sockets.length) | 0;
    this.sockets[socketsIndex]?.write(MESSAGES.SHIPTUNNEL_NEW_CLIENT);
  }
}
