import type { Metadata } from "next";

export function withCanonical(path: string, meta: Metadata = {}): Metadata {
  const canonical = path.startsWith("/") ? path : `/${path}`;
  return {
    ...meta,
    alternates: { ...(meta.alternates || {}), canonical },
    openGraph: { ...(typeof meta.openGraph === "object" ? meta.openGraph : {}), url: canonical },
  };
}
