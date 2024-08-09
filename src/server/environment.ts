import dotenv from "dotenv";

dotenv.config();

const environment = {
  SHIPTUNNEL_SERVER_HOST: process.env["SHIPTUNNEL_SERVER_HOST"]!,
  SHIPTUNNEL_SERVER_PORT: parseInt(process.env["SHIPTUNNEL_SERVER_PORT"]!),
  SHIPTUNNEL_SERVER_MAX_CONNECTION_RETRY_ATTEMPTS: parseInt(
    process.env["SHIPTUNNEL_SERVER_MAX_CONNECTION_RETRY_ATTEMPTS"]!
  ),
};

export default environment;
