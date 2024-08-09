import net from "net";
import { MESSAGES } from "../constants";
import { BehaviorSubject, firstValueFrom, Subject } from "rxjs";

export type Socket = net.Socket & {
  forwardedSocket?: Socket;
  incommingSocket?: Socket;
};

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
      this.newSocketsAvailable.subscribe({
        next: () => {
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
