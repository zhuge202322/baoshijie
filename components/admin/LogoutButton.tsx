"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
      window.location.assign("/admin/login");
    } finally {
      setPending(false);
    }
  }

  return (
    <button className="admin-signout" type="button" onClick={logout} disabled={pending}>
      <LogOut size={17} aria-hidden="true" />
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
