import net from "net";
import { logger } from "../../monitoring";
import { tunnels } from "./structures";
import { UNAVAILABLE_EVENTS } from "../../constants";

const onTunnelConnection = (tunnelSocket: net.Socket) => {
  tunnelSocket.once("data", (data) => {
    const subdomain = data.toString();
    if (!subdomain) return tunnelSocket.end();

    let willTimeout = false;
    setTimeout(() => {
      if (willTimeout) {
        tunnelSocket.end();
      }
    }, 10000);

    UNAVAILABLE_EVENTS.forEach((event) => {
      tunnelSocket.on(event, () => {
        willTimeout = false;
        const initialSize = tunnels[subdomain]?.length || 0;
        tunnels[subdomain] = tunnels[subdomain]?.filter((socket) => {
          if (socket === tunnelSocket) {
            if (event !== "data") {
              tunnelSocket.end();
            }
            logger.log(
              `PROXY: Tunnel removed because of event ${event}: ${
                tunnels[subdomain]?.length || 0
              }`
            );
            return false;
          }

          return true;
        });

        const finalSize = tunnels[subdomain]?.length || 0;
        if (finalSize < initialSize) {
          logger.log(
            `PROXY: Available tunnels for ${subdomain}: ${
              tunnels[subdomain]?.length || 0
            }`
          );
        }
      });
    });

    logger.log(
      `PROXY: New tunnel connected to handle requests from ${subdomain}`
    );
    tunnels[subdomain] = tunnels[subdomain] || [];
    tunnels[subdomain].push(tunnelSocket);
    logger.log(
      `PROXY: Available tunnels for ${subdomain}: ${
        tunnels[subdomain]?.length || 0
      }`
    );
  });
};

export default onTunnelConnection;
