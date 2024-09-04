import { createProxy } from "./proxy";
import { createTunnel } from "./tunnel";

const FORWARDED_HOST = process.env["FORWARDED_HOST"] || "localhost";
const FORWARDED_PORT = process.env["FORWARDED_PORT"] || "5500";
const AVAILABILITY = process.env["AVAILABILITY"] || "5";

const PROXY_HOST = process.env["PROXY_HOST"] || "localhost";
const PROXY_PORT = process.env["PROXY_PORT"] || "8001";

const CLIENT_HOST = process.env["CLIENT_HOST"] || "localhost";
const CLIENT_PORT = process.env["CLIENT_PORT"] || "8002";

const MODE = process.env["MODE"] || "all";

if (["tunnel", "all"].includes(MODE)) {
  const tunnel = createTunnel({
    forwardedHost: FORWARDED_HOST,
    forwardedPort: parseInt(FORWARDED_PORT),
    proxyHost: PROXY_HOST,
    proxyPort: parseInt(PROXY_PORT),
    availability: parseInt(AVAILABILITY),
  });
  tunnel.listen();
}

if (["proxy", "all"].includes(MODE)) {
  const proxy = createProxy({
    proxyHost: PROXY_HOST,
    proxyPort: parseInt(PROXY_PORT),
    clientHost: CLIENT_HOST,
    clientPort: parseInt(CLIENT_PORT),
  });

  proxy.listen();
}
