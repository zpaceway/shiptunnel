import net from "net";
import { TunnelSocket } from "../proxy/types";

export const bindSokets = (socket1: net.Socket, socket2: TunnelSocket) => {
  socket1.on("end", () => socket2.close());
  socket1.on("error", () => socket2.close());
  socket1.on("close", () => socket2.close());
  socket1.on("timeout", () => socket2.close());
  socket1.on("data", (data) => socket2.send(data));

  socket2.on("error", () => socket1.end());
  socket2.on("close", () => socket1.end());
  socket2.on("message", (message) => socket1.write(message as Buffer));
};
