type WriteError = { message?: string } | null;

export async function writeFlexible(
  run: (row: Record<string, unknown>) => PromiseLike<{ error: WriteError }>,
  row: Record<string, unknown>,
  optional: string[],
) {
  let payload = { ...row };
  let result = await run(payload);
  while (result.error) {
    const message = String(result.error.message || "").toLowerCase();
    const missing = optional.find((column) => column in payload && message.includes(column));
    if (!missing) return result.error;
    delete payload[missing];
    payload = { ...payload };
    result = await run(payload);
  }
  return null;
}
