import crypto from 'crypto';

class AESEncryption {
  public static readonly ENCRYPTION_KEY: string =
    'a9c21fe75ceae3f1cad35f189c7ba866';

  public static encrypt(buffer: Buffer) {
    const hash = crypto
      .createHash('md5')
      .update(crypto.randomBytes(32))
      .digest('hex')
      .substring(0, 16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      this.ENCRYPTION_KEY,
      hash,
    );
    const encData =
      cipher.update(buffer.toString('utf-8'), 'utf8', 'base64') +
      cipher.final('base64');
    const rawPacket = Buffer.from(
      JSON.stringify({
        data: encData,
        checksum: Buffer.from(hash).toString('base64'),
      }),
    );
    return Buffer.concat([rawPacket, Buffer.from([0x0d, 0x0a])]);
  }

  public static decrypt(buffer: Buffer) {
    const json = JSON.parse(buffer.toString());
    const iv = Buffer.from(json.checksum, 'base64').toString('utf-8');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      this.ENCRYPTION_KEY,
      iv,
    );
    return Buffer.from(
      decipher.update(json.data, 'base64', 'utf-8') + decipher.final('utf-8'),
    );
  }
}

export default AESEncryption;
