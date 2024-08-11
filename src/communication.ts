import logger from "./logger";

export const SHIPTUNNEL_NEW_CLIENT_MESSAGE = "__NEW_CLIENT__";
export const SHIPTUNNEL_CLIENT_CONNECT_MESSAGE = "__CLIENT_CONNECT__";

export const generateHttp500responseMessage = () => {
  const http500responseBody =
    `<html>\r\n` +
    `<head><title>500 Internal Server Error</title></head>\r\n` +
    `<body>\r\n` +
    `<h1>Internal Server Error</h1>\r\n` +
    `<p>An unexpected error occurred.</p>\r\n` +
    `</body>\r\n` +
    `</html>\r\n`;

  const contentLength = Buffer.byteLength(http500responseBody, "utf-8");
  ``;

  return (
    `HTTP/1.1 500 Internal Server Error\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n` +
    `Content-Length: ${contentLength}\r\n` +
    `Connection: close\r\n\r\n` +
    http500responseBody
  );
};

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

export const parseIncommingData = (incommingData: Buffer) => {
  const data = incommingData.toString();
  const head = data.split("\r\n\r\n")[0] || "";
  const hostHeader = head.match(/Host: (.+?)(\r\n|\n)/i);
  const domain = hostHeader?.[1]?.trim();
  const shiptunnelKeyHeader = head.match(/Shiptunnel-Key: (.+?)(\r\n|\n)/i);
  const shiptunnelMessageHeader = head.match(
    /Shiptunnel-Message: (.+?)(\r\n|\n)/i
  );
  const shiptunnelKey = shiptunnelKeyHeader?.[1]?.trim();
  const shiptunnelMessage = shiptunnelMessageHeader?.[1]?.trim();

  logger.log(`Incomming data \n${head.substring(0, 200)}`);

  return {
    domain,
    shiptunnelKey,
    shiptunnelMessage,
  };
};
