import { readPreview } from "../lib/preview/http";

export async function PreviewOnly({ children }: { children: React.ReactNode }) {
  const preview = await readPreview();
  if (preview?.actor.kind !== "agent") return <p>Not available yet</p>;
  return children;
}
