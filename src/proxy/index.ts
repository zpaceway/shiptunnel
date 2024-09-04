import net from "net";
import { logger } from "../monitoring";

export const createProxy = ({
  proxyHost,
  proxyPort,
  clientPort,
  clientHost,
}: {
  proxyHost: string;
  proxyPort: number;
  clientHost: string;
  clientPort: number;
}) => {
  const availableTunnelSocketsMappedBySubdomain: Record<
    string,
    net.Socket[] | undefined
  > = {};
  const tunnelServer = net.createServer({
    keepAlive: true,
  });

  tunnelServer.on("connection", (tunnelSocket) => {
    tunnelSocket.once("data", (data) => {
      const subdomain = data.toString();
      if (!subdomain) return tunnelSocket.end();
      logger.log(
        `PROXY: New tunnel connected to handle requests from ${subdomain}`
      );

      availableTunnelSocketsMappedBySubdomain[subdomain] =
        availableTunnelSocketsMappedBySubdomain[subdomain] || [];
      availableTunnelSocketsMappedBySubdomain[subdomain].push(tunnelSocket);

      logger.log(
        `PROXY: Available tunnels for ${subdomain}: ${
          availableTunnelSocketsMappedBySubdomain[subdomain]?.length || 0
        }`
      );

      ["data", "end", "timeout", "error"].forEach((event) => {
        tunnelSocket.on(event, () => {
          const initialSize =
            availableTunnelSocketsMappedBySubdomain[subdomain]?.length || 0;
          availableTunnelSocketsMappedBySubdomain[subdomain] =
            availableTunnelSocketsMappedBySubdomain[subdomain]?.filter(
              (socket) => {
                if (socket === tunnelSocket) {
                  logger.log(
                    `PROXY: Tunnel removed because of event ${event}: ${
                      availableTunnelSocketsMappedBySubdomain[subdomain]
                        ?.length || 0
                    }`
                  );
                  return false;
                }

                return true;
              }
            );

          const newSize =
            availableTunnelSocketsMappedBySubdomain[subdomain]?.length || 0;

          if (newSize !== initialSize)
            logger.log(
              `PROXY: Available tunnels for ${subdomain}: ${
                availableTunnelSocketsMappedBySubdomain[subdomain]?.length || 0
              }`
            );
        });
      });
    });
  });

  const clientServer = net.createServer();

  clientServer.on("connection", (clientSocket) => {
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

      const tunnelSocket = availableTunnelSocketsMappedBySubdomain[host]?.pop();

      if (!tunnelSocket) return clientSocket.end();

      logger.log(
        `PROXY: Tunnel available found for client, proxying connections to now tunnel`
      );
      logger.log(
        `PROXY: Left available tunnels for ${host}: ${
          availableTunnelSocketsMappedBySubdomain[host]?.length || 0
        }`
      );

      tunnelSocket.write(data);
      tunnelSocket.pipe(clientSocket, { end: true });
      clientSocket.pipe(tunnelSocket, { end: true });

      clientSocket.resume();
    });
  });

  const listen = () => {
    tunnelServer.listen(proxyPort, proxyHost);
    clientServer.listen(clientPort, clientHost);
  };

  return { listen };
};
