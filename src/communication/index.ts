import net from "net";
import { TunnelSocket } from "../proxy/types";

export const bindSokets = (socket1: net.Socket, socket2: TunnelSocket) => {
  socket1.once("end", () => socket2.close());
  socket1.once("error", () => socket2.close());
  socket1.once("close", () => socket2.close());
  socket1.once("timeout", () => socket2.close());
  socket1.on("data", (data) => socket2.send(data));

  socket2.once("error", () => socket1.end());
  socket2.once("close", () => socket1.end());
  socket2.on("message", (message) => socket1.write(message as Buffer));
};
