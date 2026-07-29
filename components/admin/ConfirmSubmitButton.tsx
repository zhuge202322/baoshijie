"use client";

import { Trash2 } from "lucide-react";

export function ConfirmSubmitButton({ label, message, form }: { label: string; message: string; form?: string }) {
  return (
    <button
      className="admin-button admin-button-danger"
      type="submit"
      form={form}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <Trash2 size={15} aria-hidden="true" /> {label}
    </button>
  );
}
