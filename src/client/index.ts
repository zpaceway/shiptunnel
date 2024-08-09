import net from "net";
import { MESSAGES } from "../constants";
import environment from "./environment";

const SHIPTUNNEL_SERVER_HOST = environment.SHIPTUNNEL_SERVER_HOST;
const SHIPTUNNEL_SERVER_PORT = environment.SHIPTUNNEL_SERVER_PORT;
const FORWARDED_HOST = environment.FORWARDED_HOST;
const FORWARDED_PORT = environment.FORWARDED_PORT;

const createShiptunnelClient = (options: { main?: boolean } = {}) => {
  const shiptunnelClient = new net.Socket();

  shiptunnelClient.connect(
    SHIPTUNNEL_SERVER_PORT,
    SHIPTUNNEL_SERVER_HOST,
    () => {
      shiptunnelClient.write(MESSAGES.SHIPTUNNEL_CONNECT_SERVER);
      console.log(
        `Client connected to Shiptunnel server at ${SHIPTUNNEL_SERVER_HOST}:${SHIPTUNNEL_SERVER_PORT}`
      );
      console.log(
        `Incomming requests to Shiptunnel server will be forwarded to ${FORWARDED_HOST}:${FORWARDED_PORT}\n\n`
      );
    }
  );

  const handleIncommingData = (incommingData: Buffer) => {
    const incommingDataText = incommingData.toString();
    console.log(`Received request from Shiptunnel`);

    if (incommingDataText === MESSAGES.SHIPTUNNEL_NEW_CLIENT) {
      return createShiptunnelClient();
    }
    const internalClient = new net.Socket();

    internalClient.connect(FORWARDED_PORT, FORWARDED_HOST, () => {
      internalClient.write(incommingData);
    });

    internalClient.on("data", (responseData) => {
      const responseDataText = responseData.toString();
      shiptunnelClient.write(responseData);
      if (responseDataText.endsWith("\n\r\n\r")) internalClient.end();
    });
  };

  shiptunnelClient.on("data", handleIncommingData);

  shiptunnelClient.on("end", () => {
    console.log("Disconnected from server");
    if (options.main) {
      createShiptunnelClient({
        main: true,
      });
    }
  });

  shiptunnelClient.on("error", (err) => {
    console.error("Connection error:", err);
    if (options.main) {
      createShiptunnelClient({
        main: true,
      });
    }
  });
};

createShiptunnelClient({
  main: true,
});
