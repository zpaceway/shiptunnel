import net from "net";

export type TSocket = net.Socket & {
  forwardedSocket?: TSocket;
  incommingSocket?: TSocket;
};

export type TClientOptions = {
  skey: string;
  shost: string;
  sport: number;
  fhost: string;
  fport: number;
  poolSize: number;
};

export type TServerOptions = {
  skey: string;
  sport: number;
  stimeout: number;
};

export type OptionalString<T> = {
  [K in keyof T]?: string;
};
