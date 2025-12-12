import { SignJWT, jwtVerify } from "jose";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be set and at least 32 characters long");
}

const secretKey = new TextEncoder().encode(secret);

export type AuthTokenPayload = {
  email: string;
  exp?: number;
  iat?: number;
  sub: string;
};

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid token subject");
  }

  if (!payload.email || typeof payload.email !== "string") {
    throw new Error("Invalid token payload");
  }

  return {
    email: payload.email,
    exp: payload.exp,
    iat: payload.iat,
    sub: payload.sub,
  };
}
