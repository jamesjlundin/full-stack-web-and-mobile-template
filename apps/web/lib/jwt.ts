import { SignJWT, jwtVerify } from "jose";

export type AuthTokenPayload = {
  email: string;
  exp?: number;
  iat?: number;
  sub: string;
};

// Lazy initialization of secret key to avoid build-time errors
let _secretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (_secretKey) return _secretKey;

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set and at least 32 characters long",
    );
  }
  _secretKey = new TextEncoder().encode(secret);
  return _secretKey;
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ["HS256"],
  });

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
