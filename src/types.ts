import net from "net";

export type TShiptunnelSocket = net.Socket & {
  shiptunnelDomain?: string;
  client?: {
    shouldSendPing: boolean;
    lastPongAt: Date;
    incommingSocket?: TShiptunnelSocket;
  };
  incomming?: {
    forwardedSocket?: TShiptunnelSocket;
  };
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
