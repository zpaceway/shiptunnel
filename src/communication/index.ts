import net from "net";

export const bindSokets = (socket1: net.Socket, socket2: net.Socket) => {
  // [
  //   [socket1, socket2],
  //   [socket2, socket1],
  // ].forEach(([s1, s2]) => {
  //   s1!.once("close", () => s2!.end());
  //   s1!.once("error", () => s2!.end());
  //   s1!.once("timeout", () => s2!.end());
  //   s1!.on("data", (data) => s2!.write(data));
  //   s1!.once("end", () => {
  //     s1!.destroy();
  //     s2!.end();
  //   });
  // });
  socket1.pipe(socket2, { end: true });
  socket2.pipe(socket1, { end: true });
};

export const getRandomTimeoutValueInMilliseconds = (
  unavailableTimeoutInMilliseconds: number
) => {
  return (
    unavailableTimeoutInMilliseconds / 2 +
    (unavailableTimeoutInMilliseconds / 2) * Math.random()
  );
};
