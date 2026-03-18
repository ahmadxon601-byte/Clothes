import { randomBytes } from "crypto";

// 8-char key from unambiguous uppercase alphanumeric chars
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAccessKey(): string {
  const bytes = randomBytes(8);
  let key = "";
  for (let i = 0; i < 8; i++) {
    key += CHARS[bytes[i] % CHARS.length];
  }
  return key;
}
