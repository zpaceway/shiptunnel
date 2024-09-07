export type CreateTunnelOptions = {
  forwardedHost: string;
  forwardedPort: number;
  proxyHost: string;
  proxyPort: number;
  unavailableTimeoutInMilliseconds: number;
  availability: number;
};
