import net from "net";

export const bindSokets = (socket1: net.Socket, socket2: net.Socket) => {
  socket1.on("close", () => socket2.end());
  socket1.on("end", () => {
    socket1.destroy();
    socket2.end();
  });
  socket1.on("error", () => socket2.end());
  socket1.on("timeout", () => socket2.end());

  socket2.on("close", () => socket1.end());
  socket2.on("end", () => {
    socket2.destroy();
    socket1.end();
  });
  socket2.on("error", () => socket1.end());
  socket2.on("timeout", () => socket1.end());

  socket1.on("data", (data) => socket2.write(data));
  socket2.on("data", (data) => socket1.write(data));
};
