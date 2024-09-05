import net from "net";
import { logger } from "../monitoring";
import { UNAVAILABLE_EVENTS } from "../constants";
import { CallbackQueue } from "../transmission";

const listenerQueue = new CallbackQueue({ delay: 100 });
const timeoutQueue = new CallbackQueue({ delay: 100 });

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
      allowHalfOpen: true,
      host: forwardedHost,
      port: forwardedPort,
    });
    const proxyConnection = net.createConnection({
      keepAlive: true,
      allowHalfOpen: true,
      host: proxyHost,
      port: proxyPort,
    });

    forwardedConnection.pipe(proxyConnection, { end: true });
    proxyConnection.pipe(forwardedConnection, { end: true });

    let willTimeout = true;

    setTimeout(() => {
      timeoutQueue.push(() => {
        if (willTimeout) {
          forwardedConnection.end();
          proxyConnection.end();
        }
      });
    }, 20000);

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
