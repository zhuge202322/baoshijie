import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminNav username={session.username} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
