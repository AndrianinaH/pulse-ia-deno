// utils/jwt.ts
import {
  create,
  getNumericDate,
  verify,
} from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const encoder = new TextEncoder();
const secret = Deno.env.get("JWT_SECRET") || "supersecret";

let key: CryptoKey;
async function getKey(): Promise<CryptoKey> {
  if (!key) {
    key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
  return key;
}

export async function generateJwt(payload: Record<string, unknown>) {
  const k = await getKey();
  const exp = getNumericDate(60 * 60 * 24); // 24 h
  return await create({ alg: "HS256", typ: "JWT" }, { ...payload, exp }, k);
}

export async function verifyJwt(token: string) {
  const k = await getKey();
  try {
    const payload = await verify(token, k);
    if (
      typeof payload === "object" &&
      payload.exp &&
      payload.exp < getNumericDate(0)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
