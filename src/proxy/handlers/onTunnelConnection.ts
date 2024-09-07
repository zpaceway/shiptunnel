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

    let willTimeout = true;
    setTimeout(() => {
      if (willTimeout) {
        tunnelSocket.end();
      }
    }, unavailableTimeoutInMilliseconds);

    UNAVAILABLE_EVENTS.forEach((event) => {
      tunnelSocket.on(event, () => {
        willTimeout = false;
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
