import dotenv from "dotenv";

dotenv.config();

const environment = {
  SHIPTUNNEL_SERVER_PORT: parseInt(process.env["SHIPTUNNEL_SERVER_PORT"]!),
  SHIPTUNNEL_SERVER_MAX_CONNECTION_RETRY_ATTEMPTS: parseInt(
    process.env["SHIPTUNNEL_SERVER_MAX_CONNECTION_RETRY_ATTEMPTS"]!
  ),
  SHIPTUNNEL_SERVER_MAX_WAIT_FOR_CONNECTION_MS: parseInt(
    process.env["SHIPTUNNEL_SERVER_MAX_WAIT_FOR_CONNECTION_MS"]!
  ),
};

export default environment;
