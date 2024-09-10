import { tunnelsManager } from "./structures";
import { UNAVAILABLE_EVENTS } from "../../constants";
import { TunnelSocket } from "../types";

const onTunnelConnection = (
  tunnelSocket: TunnelSocket,
  unavailableTimeoutInMilliseconds: number
) => {
  tunnelSocket.once("data", (data) => {
    const host = data.toString();
    if (!host) return tunnelSocket.end();

    const timeout = setTimeout(() => {
      onUnavailable("timeout");
    }, unavailableTimeoutInMilliseconds / 2 + (unavailableTimeoutInMilliseconds / 2) * Math.random());

    const onUnavailable = (reason: string) => {
      clearTimeout(timeout);
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
