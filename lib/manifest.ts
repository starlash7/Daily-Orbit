export type AccountAssociation = {
  header: string;
  payload: string;
  signature: string;
};

const DEFAULT_BASE_URL = "https://jerusalem-ebon.vercel.app";

export function normalizeBaseUrl(rawBaseUrl: string): string {
  return rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}

export function getBaseUrl(requestOrigin?: string): string {
  const envBaseUrl = process.env.NEXT_PUBLIC_URL?.trim();
  if (envBaseUrl) return normalizeBaseUrl(envBaseUrl);
  if (requestOrigin) return normalizeBaseUrl(requestOrigin);
  return DEFAULT_BASE_URL;
}

export function getCanonicalDomain(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export function getAccountAssociation(): AccountAssociation {
  return {
    header: process.env.FARCASTER_HEADER?.trim() || "",
    payload: process.env.FARCASTER_PAYLOAD?.trim() || "",
    signature: process.env.FARCASTER_SIGNATURE?.trim() || ""
  };
}

export function hasAccountAssociation(accountAssociation = getAccountAssociation()): boolean {
  return Boolean(
    accountAssociation.header &&
      accountAssociation.payload &&
      accountAssociation.signature
  );
}
