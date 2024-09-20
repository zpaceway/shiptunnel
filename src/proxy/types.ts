import net from "net";
import ws from "ws";

export type CreateProxyOptions = {
  proxyHost: string;
  proxyPort: number;
  clientHost: string;
  clientPort: number;
  connectionTimeoutInMilliseconds: number;
};

export type TunnelSocket = ws.WebSocket & {
  unavailable?: (reason: string) => void;
};
