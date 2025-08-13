import EventEmitter from "events";
import net from "net";

import AESEncryption from "./utils/AESEncryption";

interface ConnectionEvents {
  close: [];
  connect: [];
  upstream: [
    data: { command: string; param: string; payload: Buffer },
    cancel: () => boolean
  ];
  downstream: [
    data: { command: string; param: string[]; payload: Buffer },
    cancel: () => boolean
  ];
}

class Connection extends EventEmitter<ConnectionEvents> {
  public readonly VHACK_HOST = "vhack.cc";
  public readonly VHACK_PORT = 8182;

  private _localSocket: net.Socket;
  private _remoteSocket: net.Socket;

  public constructor(socket: net.Socket) {
    super();
    this._localSocket = socket;
    this._remoteSocket = new net.Socket();
    this.setMaxListeners(20);
    this.initializeConnection();
  }

  public get localSocket() {
    return this._localSocket;
  }

  public get remoteSocket() {
    return this._remoteSocket;
  }

  private initializeConnection() {
    this._remoteSocket.connect({
      host: this.VHACK_HOST,
      port: this.VHACK_PORT,
      family: 4,
    });

    this._remoteSocket.on("close", () => this.emit("close"));
    this._remoteSocket.on("connect", () => {
      this.emit("connect");
    });

    this._remoteSocket.on("end", () => {
      this._localSocket.end();
      this._remoteSocket.end();
    });
    this._localSocket.on("end", () => {
      this._remoteSocket.end();
      this._localSocket.end();
    });

    let remoteBuffer = Buffer.alloc(0);
    this._remoteSocket.on("data", (data) => {
      let isCanceled = false;
      const cancel = () => (isCanceled = true);
      remoteBuffer = Buffer.concat([remoteBuffer, data]);

      let newLineIndex;
      while ((newLineIndex = remoteBuffer.indexOf("\r\n")) !== -1) {
        const payload = remoteBuffer.subarray(0, newLineIndex);
        const payloadString = payload.toString("utf-8");
        remoteBuffer = remoteBuffer.subarray(newLineIndex + 2);

        const match = payloadString.match(/^:([a-zA-Z0-9]):?:?\s?/);
        if (match === null) return;
        const param = payloadString.slice(match[0].length).trim();
        const command = match[1].toLowerCase();
        this.emit("upstream", { command, param, payload }, cancel);
        if (!isCanceled) {
          this._localSocket.write(
            Buffer.concat([payload, Buffer.from("\r\n")])
          );
        }
      }
    });

    let localBuffer = Buffer.alloc(0);
    this._localSocket.on("data", (data) => {
      let isCanceled = false;
      const cancel = () => (isCanceled = true);
      localBuffer = Buffer.concat([localBuffer, data]);

      let newLineIndex;
      while ((newLineIndex = localBuffer.indexOf("\r\n")) !== -1) {
        const payload = localBuffer.subarray(0, newLineIndex);
        const payloadDecrypted = AESEncryption.decrypt(payload);
        const payloadString = payloadDecrypted.toString("utf-8");
        localBuffer = localBuffer.subarray(newLineIndex + 2);

        const match = payloadString.match(/^:([a-zA-Z0-9]):?:?\s?/);
        if (match === null) return;
        const param = payloadString.slice(match[0].length).split("::");
        const command = match[1].toLowerCase();
        this.emit("downstream", { command, param, payload: payload }, cancel);
        if (!isCanceled) {
          this._remoteSocket.write(
            Buffer.concat([payload, Buffer.from("\r\n")])
          );
        }
      }
    });
  }
}

export default Connection;
