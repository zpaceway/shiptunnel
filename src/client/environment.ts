import dotenv from "dotenv";

dotenv.config();

const environment = {
  SHIPTUNNEL_SERVER_HOST: process.env["SHIPTUNNEL_SERVER_HOST"]!,
  SHIPTUNNEL_SERVER_PORT: parseInt(process.env["SHIPTUNNEL_SERVER_PORT"]!),
  FORWARDED_HOST: process.env["FORWARDED_HOST"]!,
  FORWARDED_PORT: parseInt(process.env["FORWARDED_PORT"]!),
};

export default environment;
