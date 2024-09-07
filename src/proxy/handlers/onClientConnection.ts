import net from "net";
import { logger } from "../../monitoring";
import { tunnelsManager } from "./structures";

const onClientConnection = (clientSocket: net.Socket) => {
  clientSocket.once("data", async (data) => {
    clientSocket.pause();
    const host = data
      .toString()
      .split("\r\n")
      .find((line) => line.includes("Host: "))
      ?.split("Host: ")[1]
      ?.split(":")[0];

    if (!host) return clientSocket.end();

    logger.log(
      `PROXY: New client connected to proxy trying to access ${host} via a tunnel`
    );

    const tunnelSocket = await tunnelsManager.pop(host);

    if (!tunnelSocket) return clientSocket.end();

    tunnelSocket.emit("data");
    tunnelSocket.write(data);
    clientSocket.pipe(tunnelSocket, { end: true });
    tunnelSocket.pipe(clientSocket, { end: true });

    clientSocket.resume();
  });
};

export default onClientConnection;
