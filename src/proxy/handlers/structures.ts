import net from "net";

export const tunnels: Record<string, net.Socket[] | undefined> = {};
