import net from "net";

export type TSocket = net.Socket & {
  forwardedSocket?: TSocket;
  incommingSocket?: TSocket;
  shiptunnelDomain?: string;
  shouldSendPing?: boolean;
  lastPongAt?: Date;
};

export type TClientOptions = {
  skey: string;
  shost: string;
  sport: number;
  fhost: string;
  fport: number;
  psize: number;
};

export type TServerOptions = {
  skey: string;
  sport: number;
  stimeout: number;
};

export type OptionalString<T> = {
  [K in keyof T]?: string;
};
