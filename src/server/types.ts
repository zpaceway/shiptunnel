import net from "net";

export type Socket = net.Socket & {
  forwardedSocket?: Socket;
  incommingSocket?: Socket;
};
