export interface ReadState {
  data: unknown;
  isPending?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  refetch: () => unknown;
}
export function readState(queries: ReadState[]) {
  if (queries.some((q) => q.isError && q.data === undefined)) return "error";
  if (queries.some((q) => q.data === undefined && (q.isPending || q.isLoading))) return "loading";
  if (queries.some((q) => q.isError)) return "stale";
  return "ready";
}
export function firstRunStep(subjects: number, tasks: number, calendarConnected: boolean) {
  return subjects === 0
    ? "subjects"
    : tasks === 0
      ? "tasks"
      : !calendarConnected
        ? "calendar"
        : "ready";
}
