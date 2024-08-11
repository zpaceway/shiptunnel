export const MESSAGES = {
  SHIPTUNNEL_CONNECT_SERVER: "__SHIPTUNNEL_CONNECT_SERVER__",
  SHIPTUNNEL_NEW_CLIENT: "__SHIPTUNNEL_NEW_CLIENT__",
};

export const HTTP_END_TEXT = Buffer.from("\r\n\r\n");

const http500responseBody =
  `<html>\r\n` +
  `<head><title>500 Internal Server Error</title></head>\r\n` +
  `<body>\r\n` +
  `<h1>Internal Server Error</h1>\r\n` +
  `<p>An unexpected error occurred.</p>\r\n` +
  `</body>\r\n` +
  `</html>\r\n`;

const contentLength = Buffer.byteLength(http500responseBody, "utf-8");

export const HTTP_500_RESPONSE =
  `HTTP/1.1 500 Internal Server Error\r\n` +
  `Content-Type: text/html; charset=UTF-8\r\n` +
  `Content-Length: ${contentLength}\r\n` +
  `Connection: close\r\n\r\n` +
  http500responseBody;
