import net from "net";
import { shiptunnelManager } from "./manager";
import { HTTP_END_TEXT, MESSAGES } from "../constants";
import environment from "./environment";
import { Socket } from "./types";

class ShiptunnelServer {
  private server: net.Server;

  constructor() {
    this.server = net.createServer((socket: Socket) => {
      socket.on("data", (data) => this.handleIncommingData(socket, data));
      socket.on("close", () => this.handleDisconnection(socket));
      socket.on("end", () => this.handleDisconnection(socket));
      socket.on("error", () => this.handleDisconnection(socket));
    });
  }

  handleIncommingData = async (
    socket: Socket,
    incommingData: Buffer
  ): Promise<void> => {
    const incommingDataText = incommingData.toString();

    if (incommingDataText === MESSAGES.SHIPTUNNEL_CONNECT_SERVER) {
      console.log(`New client connected`);
      shiptunnelManager.addSocket(socket);

      return;
    }

    if (socket.incommingSocket) {
      console.log(`Sending data to incomming socket`);
      socket.incommingSocket.write(incommingData);
      if (incommingDataText.endsWith(HTTP_END_TEXT)) {
        socket.incommingSocket.end();
      }

      return;
    }

    const forwardedSocket =
      socket.forwardedSocket || (await shiptunnelManager.findAvailableSocket());

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

  handleDisconnection = (socket: Socket) => {
    const forwardedSocket = shiptunnelManager.findSocket(socket);
    if (forwardedSocket) {
      shiptunnelManager.removeSocket(forwardedSocket);
      return console.log("Client disconnected");
    }

    if (socket.forwardedSocket) {
      console.log("Disconneting incomming socket from forwarded socket");
      if (
        socket.forwardedSocket.incommingSocket &&
        shiptunnelManager.sockets.length > 3
      ) {
        socket.forwardedSocket.incommingSocket.end();
      }
      socket.forwardedSocket.incommingSocket = undefined;
      socket.forwardedSocket = undefined;
    }
  };

  listen = () => {
    this.server.listen(environment.SHIPTUNNEL_SERVER_PORT, () => {
      console.log(
        `Shiptunnel server running at port ${environment.SHIPTUNNEL_SERVER_PORT}\n\n`
      );
    });
  };
}

const shiptunnelServer = new ShiptunnelServer();
shiptunnelServer.listen();
