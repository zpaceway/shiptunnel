import net from "net";
import http from "http";
import ws from "ws";
import onTunnelConnection from "./handlers/onTunnelConnection";
import onClientConnection from "./handlers/onClientConnection";
import { CreateProxyOptions } from "./types";
import { tunnelsManager } from "./handlers/structures";

export const createProxy = ({
  proxyHost,
  proxyPort,
  clientPort,
  clientHost,
  connectionTimeoutInMilliseconds,
}: CreateProxyOptions) => {
  tunnelsManager.setConnectionTimeoutInMilliseconds(
    connectionTimeoutInMilliseconds
  );

  const tunnelServer = http.createServer({
    keepAlive: true,
  });
  const clientServer = net.createServer({
    keepAlive: true,
  });

  const tunnelWs = new ws.Server({ server: tunnelServer });

  tunnelWs.on("connection", onTunnelConnection);
  clientServer.on("connection", onClientConnection);

  const listen = () => {
    tunnelServer.listen(proxyPort, proxyHost);
    clientServer.listen(clientPort, clientHost);
  };

  return { listen };
};
