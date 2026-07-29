const savedMessages: Record<string, string> = {
  "category-created": "Category created.",
  "category-updated": "Category updated.",
  "category-deleted": "Category deleted.",
  "product-created": "Product created.",
  "product-updated": "Product updated.",
  "product-archived": "Product archived.",
  "product-restored": "Product restored.",
  "product-deleted": "Product deleted."
};

export function AdminNotice({ error, saved }: { error?: string; saved?: string }) {
  if (error) return <p className="admin-notice admin-notice-error" role="alert">{error}</p>;
  if (saved && savedMessages[saved]) return <p className="admin-notice admin-notice-success" role="status">{savedMessages[saved]}</p>;
  return null;
}
