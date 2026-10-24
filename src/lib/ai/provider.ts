export type LlmDraft = { text: string; provider: string };

export type LlmProvider = {
  id: string;
  draft: (prompt: string) => Promise<LlmDraft>;
};

/** No network. A future provider can replace this without changing the desk. */
export const noopProvider: LlmProvider = {
  id: "noop",
  async draft() {
    return { text: "", provider: "noop" };
  },
};

export function activeProvider(): LlmProvider {
  return noopProvider;
}
