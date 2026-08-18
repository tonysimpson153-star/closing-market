import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const APPLE_AUDIENCE = process.env.APPLE_CLIENT_ID || "com.app.closingmarket";

export async function verifyAppleIdentityToken(identityToken: string): Promise<{ subject: string; email: string | null }> {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience: APPLE_AUDIENCE,
  });
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Apple identity token subject is missing");
  }
  return { subject: payload.sub, email: typeof payload.email === "string" ? payload.email : null };
}
