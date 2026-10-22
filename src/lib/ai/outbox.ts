export type OutboxStatus = "pending" | "done" | "failed";

export type OutboxEvent = {
  kind: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
};

/** Builds a pending event. Nothing here writes to the database. */
export function pendingEvent(kind: string, payload: Record<string, unknown>): OutboxEvent {
  return { kind, payload, status: "pending" };
}
