import { redirect } from "next/navigation";

/**
 * This deployment is the admin panel and nothing else. The root exists only so
 * that hitting the bare origin lands somewhere sensible instead of on a 404.
 *
 * A server redirect is correct here — unlike `/admin`, this decision needs no
 * knowledge of the session. `/admin` then makes the authenticated-or-not call.
 */
export default function RootPage() {
  redirect("/admin");
}
