import net from "net";
import { logger } from "../../monitoring";

class TunnelsManager {
  connectionTimeoutInMilliseconds?: number;
  tunnels: Record<string, net.Socket[] | undefined>;

  constructor() {
    this.tunnels = {};
  }

  setConnectionTimeoutInMilliseconds(value: number) {
    this.connectionTimeoutInMilliseconds = value;
  }

  async pop(host: string) {
    logger.log(
      `PROXY: Trying to find a tunnel to handle requests from ${host}`
    );

    const tunnel = await new Promise<net.Socket | undefined>((res) => {
      const timeout = setTimeout(() => {
        clearInterval(interval);
        res(undefined);
      }, this.connectionTimeoutInMilliseconds);

      const interval = setInterval(() => {
        const tunnel = this.tunnels[host]?.[0];
        if (tunnel) {
          tunnel.emit("unavailable");
          clearTimeout(timeout);
          clearInterval(interval);
          res(tunnel);
        }
      }, 50);
    });

    if (!tunnel) {
      logger.log(`PROXY: No available tunnel for ${host} was found`);
    } else {
      logger.log(
        `PROXY: Tunnel available found for client, proxying connections to now tunnel`
      );
      logger.log(
        `PROXY: Left available tunnels for ${host}: ${
          this.tunnels[host]?.length || 0
        }`
      );
    }

    return tunnel;
  }

  push(host: string, tunnel: net.Socket) {
    logger.log(`PROXY: New tunnel attached to handle requests from ${host}`);
    this.tunnels[host] = this.tunnels[host] || [];
    this.tunnels[host].push(tunnel);
    logger.log(
      `PROXY: Available tunnels for ${host}: ${this.tunnels[host]?.length || 0}`
    );
  }

  remove(host: string, tunnel: net.Socket, reason: string) {
    const initialSize = this.tunnels[host]?.length || 0;
    this.tunnels[host] = this.tunnels[host]?.filter((socket) => {
      if (socket === tunnel) {
        logger.log(
          `PROXY: Tunnel removed because of reason: ${reason}: ${
            this.tunnels[host]?.length || 0
          }`
        );
        return false;
      }

      return true;
    });

    const finalSize = this.tunnels[host]?.length || 0;
    if (finalSize < initialSize) {
      logger.log(
        `PROXY: Available tunnels for ${host}: ${
          this.tunnels[host]?.length || 0
        }`
      );
    }
  }
}

export const tunnelsManager = new TunnelsManager();
