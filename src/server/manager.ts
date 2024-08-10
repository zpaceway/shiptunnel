import { MESSAGES } from "../constants";
import { Subject } from "rxjs";
import environment from "./environment";
import { Socket } from "./types";

class SocketsManager {
  sockets: Socket[] = [];
  availableSockets$ = new Subject();

  findSocket(socket: Socket) {
    return this.sockets.find((_socket) => socket === _socket);
  }

  async findAvailableSocket() {
    console.log(
      "Trying to find available socket to handle incomming request..."
    );
    const socket = this.sockets.find((socket) => !socket.incommingSocket);

    if (socket) return socket;

    console.log(
      "No socket was found, asking the client to create a new socket..."
    );

    this.askForNewSocket();

    console.log("Waiting for new socket to be available...");

    return new Promise<Socket | undefined>((res) => {
      const timeout = setTimeout(
        () => res(undefined),
        environment.SHIPTUNNEL_SERVER_MAX_WAIT_FOR_CONNECTION_MS
      );
      this.availableSockets$.subscribe({
        next: () => {
          clearTimeout(timeout);
          return res(this.sockets.find((socket) => !socket.incommingSocket));
        },
      });
    });
  }

  removeSocket(socket: Socket) {
    this.sockets = this.sockets.filter((_socket) => socket !== _socket);
    this.availableSockets$.next(true);
  }

  addSocket(socket: Socket) {
    this.sockets = [...this.sockets, socket];
    this.availableSockets$.next(true);
  }

  askForNewSocket() {
    const socketsIndex = (Math.random() * this.sockets.length) | 0;
    this.sockets[socketsIndex]?.write(MESSAGES.SHIPTUNNEL_NEW_CLIENT);
  }
}

export const shiptunnelManager = new SocketsManager();
