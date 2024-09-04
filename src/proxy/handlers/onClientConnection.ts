import net from "net";
import { logger } from "../../monitoring";
import { tunnels } from "./structures";

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

    const tunnelSocket = tunnels[host]?.pop();

    if (!tunnelSocket) return clientSocket.end();

    logger.log(
      `PROXY: Tunnel available found for client, proxying connections to now tunnel`
    );
    logger.log(
      `PROXY: Left available tunnels for ${host}: ${tunnels[host]?.length || 0}`
    );

    tunnelSocket.write(data);
    tunnelSocket.pipe(clientSocket, { end: true });
    clientSocket.pipe(tunnelSocket, { end: true });

    clientSocket.resume();
  });
};

export default onClientConnection;
