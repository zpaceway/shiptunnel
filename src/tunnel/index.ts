import net from "net";
import { logger } from "../monitoring";

export const createTunnel = ({
  forwardedHost,
  forwardedPort,
  proxyPort,
  proxyHost,
  availability,
}: {
  forwardedHost: string;
  forwardedPort: number;
  proxyHost: string;
  proxyPort: number;
  availability: number;
}) => {
  let availableTunnels: Symbol[] = [];

  const _listen = () => {
    logger.log(
      `TUNNEL: Starting tunnel to connect proxy ${proxyHost}:${proxyPort} and forwarded: ${forwardedHost}:${forwardedPort}`
    );
    const tunnelSymbol = Symbol();
    const forwardedConnection = net.createConnection({
      keepAlive: true,
      host: forwardedHost,
      port: forwardedPort,
    });
    const proxyConnection = net.createConnection({
      keepAlive: true,
      host: proxyHost,
      port: proxyPort,
    });

    forwardedConnection.pipe(proxyConnection, { end: true });
    proxyConnection.pipe(forwardedConnection, { end: true });

    ["data", "end", "timeout", "error"].forEach((event) => {
      [forwardedConnection, proxyConnection].forEach((conn) => {
        conn.on(event, () => {
          if (event !== "data") {
            forwardedConnection.end();
            proxyConnection.end();
          }
          availableTunnels = availableTunnels.filter((symbol) => {
            return symbol !== tunnelSymbol;
          });
          if (availableTunnels.length < availability) {
            logger.log(
              `TUNNEL: Tunnel removed from available tunnels because of event: ${event}`
            );
            logger.log(
              `TUNNEL: New available tunnels: ${availableTunnels.length}`
            );
            _listen();
          }
        });
      });
    });

    proxyConnection.write(proxyHost);

    availableTunnels.push(tunnelSymbol);
    logger.log(`TUNNEL: New available tunnels: ${availableTunnels.length}`);
  };

  return {
    listen: () => {
      for (let i = 0; i < availability; i++) {
        _listen();
      }
    },
  };
};
