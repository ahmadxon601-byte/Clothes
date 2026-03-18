import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret";
const JWT_EXPIRES_IN = "7d";

export type JwtPayload = {
  userId: string;
  email: string;
  role: "user" | "seller" | "admin";
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
