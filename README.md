# vhack-decryptor
Client packet decryptor for vHack Revolution


# About
Simple packet decryptor for vHack Revolution uses a proxy to intercept packets from the client or server.


# Installation
For the installation, you can run this command:

```
cd <path-to-repo>
npm run build
npm install —global ./
```


# Usage
Start the proxy:

```bash
vhack-decryptor start —host="0.0.0.0" —port="8182"
``` 
For more information you can use `vhack-decryptor start —help`