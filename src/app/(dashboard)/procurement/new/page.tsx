import { redirect } from "next/navigation";

export default function NewProcurementPage() {
  redirect("/procurement?create=1");
}
