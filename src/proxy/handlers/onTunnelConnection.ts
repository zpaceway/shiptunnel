import net from "net";
import { logger } from "../../monitoring";
import { tunnels } from "./structures";

const onTunnelConnection = (tunnelSocket: net.Socket) => {
  tunnelSocket.once("data", (data) => {
    const subdomain = data.toString();
    if (!subdomain) return tunnelSocket.end();
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

    ["data", "end", "timeout", "error"].forEach((event) => {
      tunnelSocket.on(event, () => {
        const initialSize = tunnels[subdomain]?.length || 0;
        tunnels[subdomain] = tunnels[subdomain]?.filter((socket) => {
          if (socket === tunnelSocket) {
            logger.log(
              `PROXY: Tunnel removed because of event ${event}: ${
                tunnels[subdomain]?.length || 0
              }`
            );
            tunnelSocket.end();
            return false;
          }

          return true;
        });

        const newSize = tunnels[subdomain]?.length || 0;

        if (newSize !== initialSize)
          logger.log(
            `PROXY: Available tunnels for ${subdomain}: ${
              tunnels[subdomain]?.length || 0
            }`
          );
      });
    });
  });
};

export default onTunnelConnection;
