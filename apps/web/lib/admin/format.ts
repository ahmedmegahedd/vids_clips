export function formatEgp(amount: number) {
  return `EGP ${amount.toLocaleString("en-EG", { maximumFractionDigits: 0 })}`;
}

export function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

export function formatPercent(value: number, digits = 1) {
  const abs = Math.abs(value).toFixed(digits);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${abs}%`;
}

export function formatDate(value: string | null | undefined, withYear = true) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value: string, now = Date.now()) {
  const diff = now - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(value, false);
}

export function lastActiveLabel(value: string, now = new Date("2026-09-03T10:00:00.000Z")) {
  const date = new Date(value);
  const sameDay = date.toDateString() === now.toDateString() || date.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  if (sameDay) return "Today";
  return formatDate(value, false);
}

export function greeting(name: string, date = new Date()) {
  const hour = date.getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${hello}, ${name}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
