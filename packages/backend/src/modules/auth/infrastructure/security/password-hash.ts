import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const HASH_VERSION = "scrypt-v1";
const SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 32;
const SCRYPT_OPTIONS = {
  cost: 2 ** 15,
  blockSize: 8,
  parallelization: 3,
  maxmem: 64 * 1024 * 1024,
};

interface StoredPasswordHash {
  readonly salt: Buffer;
  readonly key: Buffer;
}

// An unknown email still goes through scrypt with a correctly shaped hash.
export const DUMMY_PASSWORD_HASH = encodePasswordHash(
  Buffer.alloc(SALT_BYTES),
  Buffer.alloc(PASSWORD_HASH_BYTES),
);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derivePasswordKey(password, salt);
  return encodePasswordHash(salt, key);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const storedHash = decodePasswordHash(passwordHash);
  if (!storedHash) {
    return false;
  }

  const candidateKey = await derivePasswordKey(password, storedHash.salt);
  return timingSafeEqual(candidateKey, storedHash.key);
}

function derivePasswordKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      PASSWORD_HASH_BYTES,
      SCRYPT_OPTIONS,
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key);
      },
    );
  });
}

function encodePasswordHash(salt: Buffer, key: Buffer): string {
  return [HASH_VERSION, salt.toString("hex"), key.toString("hex")].join("$");
}

function decodePasswordHash(passwordHash: string): StoredPasswordHash | null {
  const parts = passwordHash.split("$");
  const [version, saltHex, keyHex] = parts;
  if (
    parts.length !== 3 ||
    version !== HASH_VERSION ||
    !isHexOfLength(saltHex, SALT_BYTES) ||
    !isHexOfLength(keyHex, PASSWORD_HASH_BYTES)
  ) {
    return null;
  }

  return { salt: Buffer.from(saltHex, "hex"), key: Buffer.from(keyHex, "hex") };
}

function isHexOfLength(
  value: string | undefined,
  bytes: number,
): value is string {
  return value?.length === bytes * 2 && !/[^0-9a-f]/u.test(value);
}
