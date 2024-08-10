export const MESSAGES = {
  SHIPTUNNEL_CONNECT_SERVER: `__SHIPTUNNEL_CONNECT_SERVER__${process.env[
    "SHIPTUNNEL_SERVER_KEY"
  ]!}__`,
  SHIPTUNNEL_NEW_CLIENT: `__SHIPTUNNEL_NEW_CLIENT__${process.env[
    "SHIPTUNNEL_SERVER_KEY"
  ]!}__`,
};

export const HTTP_END_TEXT = "\r\n\r\n";

const HTTP_500_RESPONSE_BODY =
  `<html>\r\n` +
  `<head><title>500 Internal Server Error</title></head>\r\n` +
  `<body>\r\n` +
  `<h1>Internal Server Error</h1>\r\n` +
  `<p>An unexpected error occurred.</p>\r\n` +
  `</body>\r\n` +
  `</html>\r\n`;

const contentLength = Buffer.byteLength(HTTP_500_RESPONSE_BODY, "utf-8");

export const HTTP_500_RESPONSE =
  `HTTP/1.1 500 Internal Server Error\r\n` +
  `Content-Type: text/html; charset=UTF-8\r\n` +
  `Content-Length: ${contentLength}\r\n` +
  `Connection: close\r\n\r\n` +
  HTTP_500_RESPONSE_BODY;
