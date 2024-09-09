import net from "net";

export type CreateProxyOptions = {
  proxyHost: string;
  proxyPort: number;
  clientHost: string;
  clientPort: number;
  unavailableTimeoutInMilliseconds: number;
  connectionTimeoutInMilliseconds: number;
};

export type TunnelSocket = net.Socket & {
  unavailable?: (reason: string) => void;
};
