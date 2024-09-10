import { tunnelsManager } from "./structures";
import { UNAVAILABLE_EVENTS } from "../../constants";
import { TunnelSocket } from "../types";
import { getRandomTimeoutValueInMilliseconds } from "../../communication";

const onTunnelConnection = (
  tunnelSocket: TunnelSocket,
  unavailableTimeoutInMilliseconds: number
) => {
  tunnelSocket.once("data", (data) => {
    const host = data.toString();
    if (!host) return tunnelSocket.end();

    const interval = setInterval(() => {
      if (!tunnelsManager.tunnels[host]?.length) return;

      clearInterval(interval);
      onUnavailable("timeout");
    }, getRandomTimeoutValueInMilliseconds(unavailableTimeoutInMilliseconds));

    const onUnavailable = (reason: string) => {
      clearTimeout(interval);
      if (reason !== "data") {
        tunnelSocket.end();
      }
      tunnelsManager.remove(host, tunnelSocket, reason);
    };

    tunnelSocket.unavailable = onUnavailable;

    UNAVAILABLE_EVENTS.forEach((event) => {
      tunnelSocket.once(event, () => onUnavailable(event));
    });

    tunnelsManager.push(host, tunnelSocket);
  });
};

export default onTunnelConnection;
