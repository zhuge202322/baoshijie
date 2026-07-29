export function requireText(value: unknown, label: string, maxLength = 5000) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`${label} is too long`);
  }
  return normalized;
}

export function optionalText(value: unknown, label: string, maxLength = 5000) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") throw new Error(`${label} must be text`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new Error(`${label} is too long`);
  return normalized;
}

export function requireSlug(value: unknown) {
  const slug = requireText(value, "Slug", 120);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must be a lowercase URL slug");
  }
  return slug;
}

export function requireNonNegativeInteger(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

export function requireSortOrder(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || Math.abs(value) > 100000) {
    throw new Error("Sort order must be an integer");
  }
  return value;
}

export function requireWebUrl(value: unknown, label = "URL") {
  const normalized = requireText(value, label, 2048);
  const parsed = new URL(normalized);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${label} must use HTTP or HTTPS`);
  }
  return parsed.toString();
}

export function requireImageUrl(value: unknown) {
  const normalized = requireText(value, "Image URL", 2048);
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return normalized;
  return requireWebUrl(normalized, "Image URL");
}

export function toBoolean(value: unknown) {
  if (typeof value !== "boolean") throw new Error("Active state must be true or false");
  return value;
}
