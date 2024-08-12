import net from "net";
import { ShiptunnelClientManager } from "./manager";
import {
  generateClientConnectMessage,
  generateHttp500responseMessage,
  parseIncommingData,
  SHIPTUNNEL_NEW_CLIENT_MESSAGE,
} from "../communication";
import logger from "../logger";

export class ShiptunnelClient {
  private manager: ShiptunnelClientManager;
  serverSocket: net.Socket;
  forwardedSocket?: net.Socket;

  constructor({ manager }: { manager: ShiptunnelClientManager }) {
    this.manager = manager;
    this.serverSocket = new net.Socket({ allowHalfOpen: true });
  }

  listen = () => {
    this.serverSocket.connect(
      this.manager.options.sport,
      this.manager.options.shost,
      this.handleServerSocketConnect
    );

    this.serverSocket.on("data", this.handleIncommingData);
    this.serverSocket.on("end", () => this.disconnect("end"));
    this.serverSocket.on("close", () => this.disconnect("close"));
    this.serverSocket.on("error", () => this.disconnect("error"));
    this.serverSocket.on("timeout", () => this.disconnect("timeout"));
  };

  sendErrorResponse = () => {
    this.serverSocket.write(generateHttp500responseMessage());
    this.disconnectForwardedSocket("error");
  };

  handleServerSocketConnect = () => {
    this.serverSocket.write(
      generateClientConnectMessage(
        this.manager.options.shost === "localhost"
          ? `${this.manager.options.shost}:${this.manager.options.sport}`
          : this.manager.options.shost,
        this.manager.options.skey
      )
    );
    logger.log(
      `Client connected to Shiptunnel server at ${this.manager.options.shost}:${this.manager.options.sport}`
    );
    logger.log(
      `Incomming requests to Shiptunnel server will be forwarded to ${this.manager.options.fhost}:${this.manager.options.fport}`
    );
  };

  handleNewForwardedData = (incommingData: Buffer) => {
    const forwardedSocket = new net.Socket({ allowHalfOpen: true });
    this.forwardedSocket = forwardedSocket;
    this.manager.checkPoolStatus();

    forwardedSocket.connect(
      this.manager.options.fport,
      this.manager.options.fhost,
      () => {
        forwardedSocket.write(incommingData);
      }
    );

    forwardedSocket.on("data", (incommingData) =>
      this.serverSocket.write(incommingData)
    );
    forwardedSocket.on("close", () => this.disconnectForwardedSocket("close"));
    forwardedSocket.on("end", () => this.disconnectForwardedSocket("end"));
    forwardedSocket.on("error", () => this.sendErrorResponse());
    forwardedSocket.on("timeout", () => this.sendErrorResponse());
  };

  disconnectForwardedSocket = (reason: string) => {
    logger.log(`Disconnected forwarded socket with reason ${reason}`);
    this.forwardedSocket?.end();
    this.forwardedSocket = undefined;
    this.manager.checkPoolStatus();
  };

  handleIncommingData = (incommingData: Buffer) => {
    const data = incommingData.toString();
    if (data === "ping") return this.serverSocket.write("pong");

    logger.log(`Received request from Shiptunnel`);

    const { shiptunnelKey, shiptunnelMessage } = parseIncommingData(data);

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

  disconnect = (reason: string) => {
    this.serverSocket.end();
    this.manager.disconnect(this, reason);
  };
}
