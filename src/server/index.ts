import net from "net";
import { shiptunnelManager } from "./manager";
import { MESSAGES } from "../constants";
import environment from "./environment";
import { Socket } from "../types";

const tcpServer = net.createServer((socket: Socket) => {
  const handleDisconnection = () => {
    const forwardedSocket = shiptunnelManager.findForwardedSocket(socket);
    if (forwardedSocket) {
      shiptunnelManager.removeForwardedSocket(forwardedSocket);
      return console.log("Client disconnected");
    }

    if (socket.forwardedSocket) {
      console.log("Disconneting incomming socket from forwarded socket");
      if (
        socket.forwardedSocket.incommingSocket &&
        shiptunnelManager.forwardedSockets.length > 3
      ) {
        socket.forwardedSocket.incommingSocket.end();
      }
      socket.forwardedSocket.incommingSocket = undefined;
      socket.forwardedSocket = undefined;
    }
  };
  const handleIncommingData = async (incommingData: Buffer, retry = 0) => {
    const incommingDataText = incommingData.toString();

    if (incommingDataText === MESSAGES.SHIPTUNNEL_CONNECT_SERVER) {
      console.log(`New client connected`);
      return shiptunnelManager.addForwardedSocket(socket);
    }

    if (socket.incommingSocket) {
      console.log(`Sending data to incomming socket`);
      socket.incommingSocket.write(incommingData);
      if (incommingDataText.endsWith("r\n\r\n")) {
        socket.incommingSocket.end();
        socket.incommingSocket = undefined;
      }

      return;
    }

    const forwardedSocket =
      socket.forwardedSocket || (await shiptunnelManager.findAvailableSocket());

    if (!forwardedSocket) {
      console.log("No available socket was found to handle request");
      if (retry < environment.SHIPTUNNEL_SERVER_MAX_CONNECTION_RETRY_ATTEMPTS) {
        return handleIncommingData(incommingData, retry + 1);
      }
      return socket.end();
    }

    forwardedSocket.incommingSocket = socket;
    socket.forwardedSocket = forwardedSocket;
    console.log("Sending data to socket forwarded socket");
    forwardedSocket.write(incommingData);
  };

  socket.on("data", handleIncommingData);

  socket.on("close", handleDisconnection);

  socket.on("end", handleDisconnection);

  socket.on("error", handleDisconnection);
});

tcpServer.listen(environment.SHIPTUNNEL_SERVER_PORT, () => {
  console.log(
    `Shiptunnel server running at port ${environment.SHIPTUNNEL_SERVER_PORT}\n\n`
  );
});
