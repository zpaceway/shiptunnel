import net from "net";
import { logger } from "../../monitoring";
import { tunnels } from "./structures";
import { UNAVAILABLE_EVENTS } from "../../constants";

const onTunnelConnection = (tunnelSocket: net.Socket) => {
  tunnelSocket.once("data", (data) => {
    const subdomain = data.toString();
    if (!subdomain) return tunnelSocket.end();

    const connectionTimeout = setTimeout(() => {
      // tunnelSocket.end();
    }, 20000);

    UNAVAILABLE_EVENTS.forEach((event) => {
      tunnelSocket.on(event, () => {
        clearTimeout(connectionTimeout);
        const initialSize = tunnels[subdomain]?.length || 0;
        tunnels[subdomain] = tunnels[subdomain]?.filter((socket) => {
          if (socket === tunnelSocket) {
            if (event !== "data") {
              tunnelSocket.end();
            }
            return false;
          }

          return true;
        });

        const newSize = tunnels[subdomain]?.length || 0;

        if (newSize !== initialSize) {
          logger.log(
            `PROXY: Tunnel removed because of event ${event}: ${
              tunnels[subdomain]?.length || 0
            }`
          );
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
