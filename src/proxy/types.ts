export type CreateProxyOptions = {
  proxyHost: string;
  proxyPort: number;
  clientHost: string;
  clientPort: number;
  unavailableTimeoutInMilliseconds: number;
  connectionTimeoutInMilliseconds: number;
};
