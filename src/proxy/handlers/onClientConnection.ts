import net from "net";
import { logger } from "../../monitoring";
import { tunnelsManager } from "./structures";
import { bindSokets } from "../../communication";

const onClientConnection = (clientSocket: net.Socket) => {
  clientSocket.once("data", (data) => {
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

    tunnelsManager.pop(host).then((tunnelSocket) => {
      if (!tunnelSocket) return clientSocket.end();

      tunnelSocket.send(data);
      bindSokets(clientSocket, tunnelSocket);
      clientSocket.resume();
    });
  });
};

export default onClientConnection;
