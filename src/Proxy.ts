import EventEmitter from "events";
import net from "net";

import Connection from "./Connection";

interface ProxyOptions {
  host?: string;
  port?: number;
}

interface ProxyEvents {
  connection: [conn: Connection];
}

class Proxy extends EventEmitter<ProxyEvents> {
  private _options: ProxyOptions;

  private _server: net.Server;

  public constructor(options: ProxyOptions) {
    super();
    this._options = options;
    this._server = new net.Server();
    this.initializeProxy();
  }

  public get server() {
    return this._server;
  }

  private initializeProxy() {
    this._server.on("connection", (socket) => {
      const connection = new Connection(socket);
      console.debug("New connection %s:%d");

      connection.on("close", () =>
        console.debug(
          "Remote connection %s:%d closed",
          socket.remoteAddress,
          socket.remotePort
        )
      );

      connection.on("connect", () =>
        console.debug(
          "Connection %s:%d connected with remote %s:%d",
          socket.remoteAddress,
          socket.remotePort,
          connection.remoteSocket.remoteAddress,
          connection.remoteSocket.remotePort
        )
      );

      socket.on("close", () =>
        console.debug(
          "Connection %s:%d closed",
          socket.remoteAddress,
          socket.remotePort
        )
      );
      this.emit("connection", connection);
    });
  }

  public listen(callback?: () => void): void {
    const _host = this._options.host || "127.0.0.1";
    const _port = this._options.port || 8182;
    this._server.listen(_port, _host, () => callback);
  }
}

export default Proxy;
