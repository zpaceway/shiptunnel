import logger from "./logger";

export const SHIPTUNNEL_NEW_CLIENT_MESSAGE = "__NEW_CLIENT__";
export const SHIPTUNNEL_CLIENT_CONNECT_MESSAGE = "__CLIENT_CONNECT__";

export const generateClientConnectMessage = (domain: string, skey: string) => {
  const httpClientConnectBody = "";

  const contentLength = Buffer.byteLength(httpClientConnectBody, "utf-8");
  ``;

  return (
    `HTTP/1.1 200 Client Connect\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n` +
    `Host: ${domain}\r\n` +
    `Shiptunnel-Key: ${skey}\r\n` +
    `Shiptunnel-Message: ${SHIPTUNNEL_CLIENT_CONNECT_MESSAGE}\r\n` +
    `Content-Length: ${contentLength}\r\n` +
    `Connection: keep-alive\r\n\r\n` +
    httpClientConnectBody
  );
};

export const generateNewClientMessage = (domain: string, skey: string) => {
  const httpClientConnectBody = "";

  const contentLength = Buffer.byteLength(httpClientConnectBody, "utf-8");
  ``;

  return (
    `HTTP/1.1 200 New Client\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n` +
    `Host: ${domain}\r\n` +
    `Shiptunnel-Key: ${skey}\r\n` +
    `Shiptunnel-Message: ${SHIPTUNNEL_NEW_CLIENT_MESSAGE}\r\n` +
    `Content-Length: ${contentLength}\r\n` +
    `Connection: keep-alive\r\n\r\n` +
    httpClientConnectBody
  );
};

export const parseIncommingData = (data: string) => {
  const head = data.split("\r\n\r\n")[0] || "";
  const hostHeader = head.match(/Host: (.+?)(\r\n|\n)/i);
  const domain = hostHeader?.[1]?.trim();
  const shiptunnelKeyHeader = head.match(/Shiptunnel-Key: (.+?)(\r\n|\n)/i);
  const shiptunnelMessageHeader = head.match(
    /Shiptunnel-Message: (.+?)(\r\n|\n)/i
  );
  const shiptunnelKey = shiptunnelKeyHeader?.[1]?.trim();
  const shiptunnelMessage = shiptunnelMessageHeader?.[1]?.trim();

  logger.log(`Incomming data \n${head.substring(0, 400)}`);

  return {
    domain,
    shiptunnelKey,
    shiptunnelMessage,
  };
};
