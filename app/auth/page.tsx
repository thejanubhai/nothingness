import { redirect } from "next/navigation";

export default function AuthRedirectPage() {
  // God Mode Universal Auth: Redirect all login attempts to the Master Hub
  redirect("https://janubhai.space/auth?app=nothingness");
}
