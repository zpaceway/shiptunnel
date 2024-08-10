export const MESSAGES = {
  SHIPTUNNEL_CONNECT_SERVER: `__SHIPTUNNEL_CONNECT_SERVER__${process.env[
    "SHIPTUNNEL_SERVER_KEY"
  ]!}__`,
  SHIPTUNNEL_NEW_CLIENT: `__SHIPTUNNEL_NEW_CLIENT__${process.env[
    "SHIPTUNNEL_SERVER_KEY"
  ]!}__`,
};

export const HTTP_END_TEXT = "\r\n\r\n";

export const HTTP_500_RESPONSE =
  `HTTP/1.1 500 Internal Server Error\r\n` +
  `Content-Type: text/html; charset=UTF-8\r\n` +
  `Content-Length: 137\r\n` +
  `Connection: close\r\n\r\n` +
  `<html>\r\n` +
  `<head><title>500 Internal Server Error</title></head>\r\n` +
  `<body>\r\n` +
  `<h1>Internal Server Error</h1>\r\n` +
  `<p>An unexpected error occurred.</p>\r\n` +
  `</body>\r\n` +
  `</html>\r\n\r\n`;
