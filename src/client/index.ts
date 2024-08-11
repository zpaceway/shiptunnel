import net from "net";
import { HTTP_500_RESPONSE, HTTP_END_TEXT, MESSAGES } from "../constants";
import { bufferEndsWith } from "../utils";
import { ShiptunnelClientManager } from "./manager";

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
      this.handleClientConnect
    );

    this.serverSocket.on("data", this.handleIncommingData);
    this.serverSocket.on("end", this.handleDisconnect);
    this.serverSocket.on("error", this.handleDisconnect);
  };

  handleErrorResponse = () => {
    this.serverSocket.write(HTTP_500_RESPONSE);
    this.forwardedSocket = undefined;
    this.manager.checkPoolStatus();
  };

  handleClientConnect = () => {
    this.serverSocket.write(
      `${MESSAGES.SHIPTUNNEL_CONNECT_SERVER}__${this.manager.options.skey}`
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

    forwardedSocket.on("data", (forwardedData) => {
      this.serverSocket.write(forwardedData);
      if (bufferEndsWith(forwardedData, HTTP_END_TEXT))
        this.forwardedSocket?.end();
    });

    forwardedSocket.on("close", this.handleForwardedSocketDisconnection);
    forwardedSocket.on("end", this.handleForwardedSocketDisconnection);
    forwardedSocket.on("error", this.handleErrorResponse);
    forwardedSocket.on("timeout", this.handleErrorResponse);

    return;
  };

  handleForwardedSocketDisconnection = () => {
    this.forwardedSocket = undefined;
    this.manager.checkPoolStatus();
  };

  handleIncommingData = (incommingData: Buffer) => {
    console.log(`Received request from Shiptunnel`);

    if (
      incommingData.equals(
        Buffer.from(
          `${MESSAGES.SHIPTUNNEL_NEW_CLIENT}__${this.manager.options.skey}`
        )
      )
    ) {
      return this.manager.addNewClient();
    }

    if (!this.forwardedSocket) {
      return this.handleNewForwardedData(incommingData);
    }

    this.forwardedSocket.write(incommingData);
  };

  handleDisconnect = () => {
    this.manager.handleDisconnect(this);
  };
}
