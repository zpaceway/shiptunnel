import net from "net";
import { logger } from "../monitoring";
import { UNAVAILABLE_EVENTS } from "../constants";
import { CreateTunnelOptions } from "./types";
import { bindSokets } from "../communication";

export const createTunnel = ({
  forwardedHost,
  forwardedPort,
  proxyPort,
  proxyHost,
  availability,
  unavailableTimeoutInMilliseconds,
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

    bindSokets(forwardedConnection, proxyConnection);

    let willTimeout = true;
    setTimeout(() => {
      if (willTimeout) {
        forwardedConnection.end();
        proxyConnection.end();
      }
    }, unavailableTimeoutInMilliseconds);

    UNAVAILABLE_EVENTS.forEach((event) => {
      [forwardedConnection, proxyConnection].forEach((conn) => {
        conn.on(event, () => {
          willTimeout = false;
          if (event !== "data") {
            forwardedConnection.end();
            proxyConnection.end();
          }
          const initialSize = availableTunnels.length;
          availableTunnels = availableTunnels.filter(
            (symbol) => symbol !== tunnelSymbol
          );
          const finalSize = availableTunnels.length;
          if (initialSize < finalSize) {
            logger.log(
              `TUNNEL: Tunnel removed from available tunnels because of event: ${event}`
            );
            logger.log(
              `TUNNEL: New available tunnels: ${availableTunnels.length}`
            );
          }
          _listen();
        });
      });
    });

    proxyConnection.write(proxyHost);

    availableTunnels.push(tunnelSymbol);
    logger.log(`TUNNEL: New available tunnels: ${availableTunnels.length}`);

    _listen();
  };

  return {
    listen: () => {
      for (let i = 0; i < availability; i++) {
        _listen();
      }
    },
  };
};
