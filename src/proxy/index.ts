import net from "net";
import onTunnelConnection from "./handlers/onTunnelConnection";
import onClientConnection from "./handlers/onClientConnection";

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
  const tunnelServer = net.createServer({
    keepAlive: true,
    allowHalfOpen: true,
  });
  const clientServer = net.createServer({
    keepAlive: true,
    allowHalfOpen: true,
  });

  tunnelServer.on("connection", onTunnelConnection);
  clientServer.on("connection", onClientConnection);

  const listen = () => {
    tunnelServer.listen(proxyPort, proxyHost);
    clientServer.listen(clientPort, clientHost);
  };

  return { listen };
};
