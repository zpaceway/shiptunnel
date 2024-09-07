import net from "net";
import { logger } from "../monitoring";
import { UNAVAILABLE_EVENTS } from "../constants";
import { CallbackQueue } from "../transmission";
import { CreateTunnelOptions } from "./types";

const listenerQueue = new CallbackQueue({ delay: 100 });

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

    let willTimeout = true;
    setTimeout(() => {
      if (willTimeout) {
        forwardedConnection.end();
        proxyConnection.end();
      }
    }, parseInt(process.env["UNAVAILABLE_TIMEOUT_IN_MILLISECONDS"]!));

    UNAVAILABLE_EVENTS.forEach((event) => {
      [forwardedConnection, proxyConnection].forEach((conn) => {
        conn.on(event, () => {
          willTimeout = false;
          if (event !== "data") {
            forwardedConnection.end();
            proxyConnection.end();
          }
          const initialSize = availableTunnels.length;
          availableTunnels = availableTunnels.filter((symbol) => {
            if (symbol === tunnelSymbol) {
              if (availableTunnels.length < availability) {
                logger.log(
                  `TUNNEL: Tunnel removed from available tunnels because of event: ${event}`
                );

                listenerQueue.push(_listen);
              }
              return false;
            }
            return true;
          });
          const finalSize = availableTunnels.length;
          if (initialSize < finalSize) {
            logger.log(
              `TUNNEL: New available tunnels: ${availableTunnels.length}`
            );
          }
        });
      });
    });

    proxyConnection.write(proxyHost);

    availableTunnels.push(tunnelSymbol);
    logger.log(`TUNNEL: New available tunnels: ${availableTunnels.length}`);

    if (availableTunnels.length < availability) {
      listenerQueue.push(_listen);
    }
  };

  return {
    listen: () => {
      for (let i = 0; i < availability; i++) {
        listenerQueue.push(_listen);
      }
    },
  };
};
