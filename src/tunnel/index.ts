import net from "net";
import ws from "ws";
import { logger } from "../monitoring";
import { CreateTunnelOptions } from "./types";
import { bindSokets } from "../communication";

export const createTunnel = ({
  forwardedHost,
  forwardedPort,
  proxyPort,
  proxyHost,
  availability,
}: CreateTunnelOptions) => {
  let availableTunnels: symbol[] = [];

  const _listen = () => {
    if (availableTunnels.length >= availability) {
      return;
    }

    logger.log(
      `TUNNEL: Starting tunnel to connect proxy ${proxyHost}:${proxyPort} and forwarded: ${forwardedHost}:${forwardedPort}`
    );
    const tunnelSymbol = Symbol();
    const proxyConnection = new ws.WebSocket(`ws://${proxyHost}:${proxyPort}`, {
      perMessageDeflate: false,
    });

    const onUnavailable = (reason: string) => {
      const initialSize = availableTunnels.length;
      availableTunnels = availableTunnels.filter(
        (symbol) => symbol !== tunnelSymbol
      );
      const finalSize = availableTunnels.length;
      if (initialSize > finalSize) {
        logger.log(
          `TUNNEL: Tunnel removed from available tunnels because of reason: ${reason}`
        );
        logger.log(`TUNNEL: New available tunnels: ${availableTunnels.length}`);
      }
      _listen();
    };

    ["close", "error", "message"].map((event) => {
      proxyConnection.once(event, () => onUnavailable(event));
    });

    proxyConnection.once("message", (message) => {
      proxyConnection.pause();

      const forwardedConnection = net.createConnection({
        keepAlive: true,
        host: forwardedHost,
        port: forwardedPort,
      });
      forwardedConnection.write(message as Buffer);
      bindSokets(forwardedConnection, proxyConnection);
      proxyConnection.resume();
      _listen();
    });

    proxyConnection.once("open", () => {
      proxyConnection.send(proxyHost);

      const enqueuePing = () => {
        setTimeout(() => {
          const pongTimeout = setTimeout(() => {
            onUnavailable("timeout");
          });
          proxyConnection.once("pong", () => {
            clearTimeout(pongTimeout);
            enqueuePing();
          });
          proxyConnection.ping();
        }, 5000);
      };

      enqueuePing();

      logger.log(`TUNNEL: New available tunnels: ${availableTunnels.length}`);
    });

    availableTunnels.push(tunnelSymbol);
  };

  return {
    listen: () => {
      for (let i = 0; i < availability; i++) {
        _listen();
      }
    },
  };
};
