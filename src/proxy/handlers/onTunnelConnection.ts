import net from "net";
import { tunnelsManager } from "./structures";
import { UNAVAILABLE_EVENTS } from "../../constants";

const onTunnelConnection = (tunnelSocket: net.Socket) => {
  tunnelSocket.once("data", (data) => {
    const host = data.toString();
    if (!host) return tunnelSocket.end();

    let willTimeout = true;
    setTimeout(() => {
      if (willTimeout) {
        tunnelSocket.end();
      }
    }, parseInt(process.env["UNAVAILABLE_TIMEOUT_IN_MILLISECONDS"]!));

    UNAVAILABLE_EVENTS.forEach((event) => {
      tunnelSocket.on(event, () => {
        willTimeout = false;
        if (event !== "data") {
          tunnelSocket.end();
        }
        tunnelsManager.remove(host, tunnelSocket);
      });
    });

    tunnelsManager.push(host, tunnelSocket);
  });
};

export default onTunnelConnection;
