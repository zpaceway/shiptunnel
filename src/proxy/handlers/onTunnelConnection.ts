import net from "net";
import { tunnelsManager } from "./structures";
import { UNAVAILABLE_EVENTS } from "../../constants";

const onTunnelConnection = (
  tunnelSocket: net.Socket,
  unavailableTimeoutInMilliseconds: number
) => {
  tunnelSocket.once("data", (data) => {
    const host = data.toString();
    if (!host) return tunnelSocket.end();

    const timeout = setTimeout(() => {
      tunnelSocket.end();
    }, unavailableTimeoutInMilliseconds);

    UNAVAILABLE_EVENTS.forEach((event) => {
      tunnelSocket.once(event, () => {
        clearTimeout(timeout);
        if (event !== "data") {
          tunnelSocket.end();
        }
        tunnelsManager.remove(host, tunnelSocket, event);
      });
    });

    tunnelsManager.push(host, tunnelSocket);
  });
};

export default onTunnelConnection;
