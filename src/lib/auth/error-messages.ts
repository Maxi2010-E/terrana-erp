/** Maps Supabase Auth errors to plain-language messages for users. */
export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Wrong email or password. Check both and try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("over_email_send_rate_limit")
  ) {
    return "Too many reset emails sent (Supabase limit). Wait about an hour, or ask an admin to set a new password under Users → Reset password — no email required.";
  }

  return message;
}
