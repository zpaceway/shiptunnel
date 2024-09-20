import { tunnelsManager } from "./structures";
import { TunnelSocket } from "../types";

const onTunnelConnection = (tunnelSocket: TunnelSocket) => {
  tunnelSocket.once("message", (data) => {
    const host = data.toString();
    if (!host) return tunnelSocket.close();

    const onUnavailable = (reason: string) => {
      if (reason !== "message") {
        tunnelSocket.close();
      }
      tunnelsManager.remove(host, tunnelSocket, reason);
    };

    tunnelSocket.unavailable = onUnavailable;

    ["message", "close", "error"].forEach((event) => {
      tunnelSocket.once(event, () => onUnavailable(event));
    });

    tunnelsManager.push(host, tunnelSocket);
  });
};

export default onTunnelConnection;
