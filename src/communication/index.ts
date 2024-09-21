import net from "net";
import { createWebSocketStream } from "ws";
import { TunnelSocket } from "../proxy/types";

export const bindSokets = (socket1: net.Socket, socket2: TunnelSocket) => {
  const socket2Duplex = createWebSocketStream(socket2);
  socket1.pipe(socket2Duplex);
  socket2Duplex.pipe(socket1);
};
