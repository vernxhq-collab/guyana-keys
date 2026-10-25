import type { Metadata } from "next";

/** Public site origin. Canonicals stay here even when a preview host differs. */
export const publicOrigin = "https://gykeys.com";

const shareImage = {
  url: `${publicOrigin}/brand/og.jpg`,
  width: 1200,
  height: 630,
  alt: "Guyana Keys",
};

export function withCanonical(path: string, meta: Metadata = {}): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const canonical = `${publicOrigin}${canonicalPath === "/" ? "/" : canonicalPath}`;
  const openGraph = typeof meta.openGraph === "object" && meta.openGraph ? meta.openGraph : {};
  const twitter = typeof meta.twitter === "object" && meta.twitter ? meta.twitter : {};
  const title = typeof meta.title === "string" ? meta.title : undefined;
  const description = typeof meta.description === "string" ? meta.description : undefined;
  return {
    ...meta,
    alternates: { ...(meta.alternates || {}), canonical },
    openGraph: {
      ...openGraph,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      url: canonical,
      images: openGraph.images || [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      ...twitter,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: twitter.images || [shareImage.url],
    },
  };
}

/** Signed-in and preview routes: unique labels, not indexed. */
export function privateMeta(path: string, title: string, description: string): Metadata {
  return withCanonical(path, {
    title,
    description,
    robots: { index: false, follow: false },
  });
}
