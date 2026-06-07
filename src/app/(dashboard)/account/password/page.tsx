import { redirect } from "next/navigation";

export default function AccountPasswordRedirectPage() {
  redirect("/settings/password");
}
