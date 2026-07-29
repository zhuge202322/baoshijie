import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { getAdminSession } from "@/lib/auth/require-admin";

const messages: Record<string, string> = {
  invalid: "The username or password is incorrect.",
  "rate-limit": "Too many attempts. Wait before trying again.",
  unconfigured: "Administrator credentials are not configured on this server."
};

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdminSession()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="admin-login-page">
      <section className="admin-login-panel">
        <LockKeyhole size={26} aria-hidden="true" />
        <p className="eyebrow">Bespoke Elemental</p>
        <h1 className="headline">Administration</h1>
        {error && messages[error] ? <p className="admin-form-error" role="alert">{messages[error]}</p> : null}
        <form action="/api/admin/session" method="post" className="admin-form">
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required minLength={12} />
          </label>
          <button className="button primary mono" type="submit">Sign In</button>
        </form>
      </section>
    </main>
  );
}
