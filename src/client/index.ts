import net from "net";
import { ShiptunnelClientManager } from "./manager";
import {
  generateClientConnectMessage,
  generateHttp500responseMessage,
  parseIncommingData,
  SHIPTUNNEL_NEW_CLIENT_MESSAGE,
} from "../communication";

export class ShiptunnelClient {
  private manager: ShiptunnelClientManager;
  serverSocket: net.Socket;
  forwardedSocket?: net.Socket;

  constructor({ manager }: { manager: ShiptunnelClientManager }) {
    this.manager = manager;
    this.serverSocket = new net.Socket();
  }

  listen = () => {
    this.serverSocket.connect(
      this.manager.options.sport,
      this.manager.options.shost,
      this.handleServerSocketConnect
    );

    this.serverSocket.on("data", this.handleIncommingData);
    this.serverSocket.on("end", this.disconnect);
    this.serverSocket.on("close", this.disconnect);
    this.serverSocket.on("error", this.disconnect);
    this.serverSocket.on("timeout", this.disconnect);
  };

  sendErrorResponse = () => {
    this.serverSocket.write(generateHttp500responseMessage());
    this.disconnectForwardedSocket();
  };

  handleServerSocketConnect = () => {
    this.serverSocket.write(
      generateClientConnectMessage(
        this.manager.options.shost,
        this.manager.options.skey
      )
    );
    console.log(
      `Client connected to Shiptunnel server at ${this.manager.options.shost}:${this.manager.options.sport}`
    );
    console.log(
      `Incomming requests to Shiptunnel server will be forwarded to ${this.manager.options.fhost}:${this.manager.options.fport}\n\n`
    );
  };

  handleNewForwardedData = (incommingData: Buffer) => {
    const forwardedSocket = new net.Socket();
    this.forwardedSocket = forwardedSocket;
    this.manager.checkPoolStatus();

    forwardedSocket.connect(
      this.manager.options.fport,
      this.manager.options.fhost,
      () => {
        forwardedSocket.write(incommingData);
      }
    );

    forwardedSocket.on("data", (forwardedData) =>
      this.serverSocket.write(forwardedData)
    );
    forwardedSocket.on("close", this.disconnectForwardedSocket);
    forwardedSocket.on("end", this.disconnectForwardedSocket);
    forwardedSocket.on("error", this.sendErrorResponse);
    forwardedSocket.on("timeout", this.sendErrorResponse);

    return;
  };

  disconnectForwardedSocket = () => {
    this.forwardedSocket?.end();
    this.forwardedSocket = undefined;
    this.manager.checkPoolStatus();
  };

  handleIncommingData = (incommingData: Buffer) => {
    console.log(`Received request from Shiptunnel`);

    const { shiptunnelKey, shiptunnelMessage } =
      parseIncommingData(incommingData);

    if (
      this.manager.options.skey === shiptunnelKey &&
      shiptunnelMessage === SHIPTUNNEL_NEW_CLIENT_MESSAGE
    ) {
      return this.manager.addNewClient();
    }

    if (!this.forwardedSocket) {
      return this.handleNewForwardedData(incommingData);
    }

    this.forwardedSocket.write(incommingData);
  };

  disconnect = () => {
    this.serverSocket.end();
    this.manager.handleDisconnect(this);
  };
}
