import net from "net";
import onTunnelConnection from "./handlers/onTunnelConnection";
import onClientConnection from "./handlers/onClientConnection";
import { CreateProxyOptions } from "./types";
import { tunnelsManager } from "./handlers/structures";

export const createProxy = ({
  proxyHost,
  proxyPort,
  clientPort,
  clientHost,
  unavailableTimeoutInMilliseconds,
  connectionTimeoutInMilliseconds,
}: CreateProxyOptions) => {
  tunnelsManager.setConnectionTimeoutInMilliseconds(
    connectionTimeoutInMilliseconds
  );

  const tunnelServer = net.createServer({
    keepAlive: true,
  });
  const clientServer = net.createServer({
    keepAlive: true,
  });

  tunnelServer.on("connection", (tunnelSocket) =>
    onTunnelConnection(tunnelSocket, unavailableTimeoutInMilliseconds)
  );
  clientServer.on("connection", onClientConnection);

  const listen = () => {
    tunnelServer.listen(proxyPort, proxyHost);
    clientServer.listen(clientPort, clientHost);
  };

  return { listen };
};
