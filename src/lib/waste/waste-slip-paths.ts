export function wasteSlipStreamPath(sessionId: string): string {
  return `/api/waste/sessions/${sessionId}/slip`;
}
