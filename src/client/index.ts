import net from "net";
import { HTTP_500_RESPONSE, HTTP_END_TEXT, MESSAGES } from "../constants";
import environment from "./environment";
import { bufferEndsWith } from "../utils";

export class ShiptunnelClient {
  private socket: net.Socket;
  private primary: boolean;
  private forwardedSocket?: net.Socket;

  constructor(options: { primary?: boolean } = {}) {
    this.socket = new net.Socket();
    this.primary = !!options.primary;
  }

  listen = () => {
    this.socket.connect(
      environment.SHIPTUNNEL_SERVER_PORT,
      environment.SHIPTUNNEL_SERVER_HOST,
      this.handleClientConnect
    );

    this.socket.on("data", this.handleIncommingData);
    this.socket.on("end", this.handleDisconnect);
    this.socket.on("error", this.handleDisconnect);
  };

  handleErrorResponse = () => {
    this.socket.write(HTTP_500_RESPONSE);
    this.forwardedSocket = undefined;
  };

  handleClientConnect = () => {
    this.socket.write(MESSAGES.SHIPTUNNEL_CONNECT_SERVER);
    console.log(
      `Client connected to Shiptunnel server at ${environment.SHIPTUNNEL_SERVER_HOST}:${environment.SHIPTUNNEL_SERVER_PORT}`
    );
    console.log(
      `Incomming requests to Shiptunnel server will be forwarded to ${environment.FORWARDED_HOST}:${environment.FORWARDED_PORT}\n\n`
    );
  };

  handleNewClientMessage = () => {
    const shiptunnelClient = new ShiptunnelClient();
    shiptunnelClient.listen();
  };

  handleNewForwardedData = (incommingData: Buffer) => {
    const forwardedSocket = new net.Socket();
    this.forwardedSocket = forwardedSocket;

    forwardedSocket.connect(
      environment.FORWARDED_PORT,
      environment.FORWARDED_HOST,
      () => {
        forwardedSocket.write(incommingData);
      }
    );

    forwardedSocket.on("data", (forwardedData) => {
      this.socket.write(forwardedData);
      if (bufferEndsWith(forwardedData, HTTP_END_TEXT))
        this.forwardedSocket?.end();
      this.forwardedSocket = undefined;
    });

    forwardedSocket.on("error", this.handleErrorResponse);
    forwardedSocket.on("timeout", this.handleErrorResponse);

    return;
  };

  handleIncommingData = (incommingData: Buffer) => {
    console.log(`Received request from Shiptunnel`);

    if (incommingData.equals(MESSAGES.SHIPTUNNEL_NEW_CLIENT)) {
      return this.handleNewClientMessage();
    }

    if (!this.forwardedSocket) {
      return this.handleNewForwardedData(incommingData);
    }

    this.forwardedSocket.write(incommingData);
  };

  handleDisconnect = () => {
    console.log("Disconnected from server");
    if (!this.primary) return;

    const shiptunnelClient = new ShiptunnelClient({
      primary: true,
    });
    shiptunnelClient.listen();
  };
}

const shiptunnelClient = new ShiptunnelClient({
  primary: true,
});
shiptunnelClient.listen();
