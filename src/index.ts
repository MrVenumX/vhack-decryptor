import pkg from "../package.json";
import cac, { CAC } from "cac";

import AESEncryption from "./utils/AESEncryption";
import Proxy from "./Proxy";

class Main {
  private _cli: CAC;

  public constructor() {
    this._cli = cac(pkg.name);
    this._cli.version(pkg.version);

    this._cli
      .command("start", "Start intercept packet with proxy")
      .option("--host <address>", "Host to proxy listen", {
        default: "127.0.0.1",
      })
      .option("--port <port>", "Host to proxy listen", { default: 8182 })
      .option("--upstream", "Show upstream log. May cause unreadable log")
      .option(
        "--encryption-key <encryption_key>",
        "Custom encryption key for decrypt packet"
      )
      .action(this.commandStart.bind(this));

    this._cli.help();
    try {
      this._cli.parse();
    } catch (err: any) {
      console.error("Error:", err?.message);
    }
  }

  private commandStart(options: {
    host: string;
    port: number;
    encryptionKey: string | null;
    upstream: boolean;
  }) {
    if (options.encryptionKey)
      AESEncryption.setEncryptionKey(options.encryptionKey);
    const proxy = new Proxy({
      host: options.host,
      port: options.port,
    });

    proxy.listen(() => {
      console.debug("Proxy listen on %s:%d", options.host, options.port);
    });

    proxy.on("connection", (conn) => {
      conn.on("downstream", (data) => {
        console.debug(
          "CLIENT -> SERVER %s %s\n - %s",
          data.command,
          data.param,
          data.payload
        );
      });

      if (options.upstream)
        conn.on("upstream", (data) => {
          console.debug(
            "SERVER -> CLIENT %s %s\n - %s",
            data.command,
            data.param,
            data.payload
          );
        });
    });
  }
}

export default new Main();
