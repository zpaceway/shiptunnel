export const MESSAGES = {
  SHIPTUNNEL_CONNECT_SERVER: `__SHIPTUNNEL_CONNECT_SERVER__${process.env[
    "SHIPTUNNEL_SERVER_KEY"
  ]!}__`,
  SHIPTUNNEL_NEW_CLIENT: `__SHIPTUNNEL_NEW_CLIENT__${process.env[
    "SHIPTUNNEL_SERVER_KEY"
  ]!}__`,
};

export const HTTP_END_TEXT = "\r\n\r\n";
