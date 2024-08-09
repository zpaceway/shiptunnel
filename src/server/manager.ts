import { MESSAGES } from "../constants";
import { Subject } from "rxjs";
import environment from "./environment";
import { Socket } from "../types";

class ShiptunnelManager {
  forwardedSockets: Socket[] = [];
  newSocketsAvailable = new Subject();

  findForwardedSocket(socket: Socket) {
    return this.forwardedSockets.find((_socket) => socket === _socket);
  }

  async findAvailableSocket() {
    console.log(
      "Trying to find available socket to handle incomming request..."
    );
    const socket = this.forwardedSockets.find(
      (socket) => !socket.incommingSocket
    );

    if (socket) return socket;

    console.log(
      "No socket was found, asking the client to create a new socket..."
    );

    this.askClientForNewSocket();

    console.log("Waiting for new socket to be available...");

    return new Promise<Socket | undefined>((res) => {
      const timeout = setTimeout(
        () => res(undefined),
        environment.SHIPTUNNEL_SERVER_MAX_WAIT_FOR_CONNECTION_MS
      );
      this.newSocketsAvailable.subscribe({
        next: () => {
          clearTimeout(timeout);
          return res(
            this.forwardedSockets.find((socket) => !socket.incommingSocket)
          );
        },
      });
    });
  }

  removeForwardedSocket(socket: Socket) {
    this.forwardedSockets = this.forwardedSockets.filter(
      (_socket) => socket !== _socket
    );
    this.newSocketsAvailable.next(true);
  }

  addForwardedSocket(socket: Socket) {
    this.forwardedSockets = [...this.forwardedSockets, socket];
    this.newSocketsAvailable.next(true);
  }

  askClientForNewSocket() {
    const forwardedHostIndex =
      (Math.random() * this.forwardedSockets.length) | 0;
    this.forwardedSockets[forwardedHostIndex]?.write(
      MESSAGES.SHIPTUNNEL_NEW_CLIENT
    );
  }
}

export const shiptunnelManager = new ShiptunnelManager();
