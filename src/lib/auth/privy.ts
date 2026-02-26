import { type NextRequest, NextResponse } from "next/server";
import {
  decodeJwt,
  importSPKI,
  jwtVerify,
  type JWTPayload,
} from "jose";

type PrivyAuthSuccess = {
  ok: true;
  claims: JWTPayload;
  wallets: Set<string>;
};

type PrivyAuthFailure = {
  ok: false;
  response: NextResponse;
};

type PrivyAuthResult = PrivyAuthSuccess | PrivyAuthFailure;

function toHttpsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function asLower(s: string): string {
  return s.toLowerCase();
}

function uniqStrings(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.filter((v): v is string => !!v))];
}

async function verifyWithVerificationKey(
  token: string,
  appId: string,
  issuerCandidates: string[]
): Promise<JWTPayload | null> {
  const verificationKeyRaw =
    process.env.PRIVY_VERIFICATION_KEY ?? process.env.PRIVY_JWT_VERIFICATION_KEY;
  if (!verificationKeyRaw) {
    return null;
  }

  const verificationKey = verificationKeyRaw.replace(/\\n/g, "\n");
  const algorithms = ["ES256", "EdDSA"] as const;
  let lastError: unknown;

  for (const algorithm of algorithms) {
    try {
      const key = await importSPKI(verificationKey, algorithm);

      for (const issuer of issuerCandidates) {
        try {
          const verified = await jwtVerify(token, key, {
            issuer,
            audience: appId,
            algorithms: [algorithm],
            clockTolerance: 5,
          });
          return verified.payload;
        } catch (err) {
          lastError = err;
        }
      }

      try {
        const verified = await jwtVerify(token, key, {
          audience: appId,
          algorithms: [algorithm],
          clockTolerance: 5,
        });
        return verified.payload;
      } catch (err) {
        lastError = err;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to verify Privy token with verification key.");
}

function parseWalletsFromClaims(claims: JWTPayload): Set<string> {
  const wallets = new Set<string>();

  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      wallets.add(asLower(value.trim()));
    }
  };

  add(claims.wallet_address);
  add(claims.walletAddress);
  add(claims.address);

  const maybeWallets = claims.wallets;
  if (Array.isArray(maybeWallets)) {
    for (const w of maybeWallets) {
      if (typeof w === "string") add(w);
      if (w && typeof w === "object") {
        add((w as Record<string, unknown>).address);
        add((w as Record<string, unknown>).wallet_address);
        add((w as Record<string, unknown>).walletAddress);
      }
    }
  }

  const linkedAccounts = claims.linked_accounts;
  if (Array.isArray(linkedAccounts)) {
    for (const account of linkedAccounts) {
      if (!account || typeof account !== "object") continue;
      const obj = account as Record<string, unknown>;
      add(obj.address);
      add(obj.wallet_address);
      add(obj.walletAddress);
    }
  }

  return wallets;
}

async function verifyPrivyToken(token: string): Promise<JWTPayload> {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not configured.");
  }

  const decoded = decodeJwt(token);
  const tokenIssuer = typeof decoded.iss === "string" ? decoded.iss : undefined;
  const normalizedIssuer = tokenIssuer
    ? toHttpsUrl(tokenIssuer).replace(/\/+$/, "")
    : undefined;

  const issuerCandidates = uniqStrings([
    process.env.PRIVY_JWT_ISSUER
      ? toHttpsUrl(process.env.PRIVY_JWT_ISSUER).replace(/\/+$/, "")
      : undefined,
    "privy.io",
    "auth.privy.io",
    normalizedIssuer,
    "https://auth.privy.io",
    "https://privy.io",
  ]);

  const verifiedWithKey = await verifyWithVerificationKey(
    token,
    appId,
    issuerCandidates
  );
  if (verifiedWithKey) {
    return verifiedWithKey;
  }

  throw new Error(
    "Privy verification key is not configured. Set PRIVY_VERIFICATION_KEY (or PRIVY_JWT_VERIFICATION_KEY) from your Privy dashboard App settings."
  );
}

export async function requirePrivyAuth(req: NextRequest): Promise<PrivyAuthResult> {
  const token = req.cookies.get("privy-token")?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  try {
    const claims = await verifyPrivyToken(token);
    return {
      ok: true,
      claims,
      wallets: parseWalletsFromClaims(claims),
    };
  } catch (err) {
    console.error("[auth] Privy token verification failed:", err);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      ),
    };
  }
}

export function requireAuthorizedWallet(
  auth: PrivyAuthSuccess,
  walletAddress: string,
  fieldName: string
): NextResponse | null {
  const normalized = asLower(walletAddress);
  if (!auth.wallets.has(normalized)) {
    return NextResponse.json(
      {
        error: `Unauthorized wallet for ${fieldName}`,
      },
      { status: 403 }
    );
  }
  return null;
}
