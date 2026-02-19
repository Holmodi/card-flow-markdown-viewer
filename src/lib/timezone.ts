import type { TimezoneOffset } from "../types/settings";

const tzMap: Record<TimezoneOffset, string> = {
  UTC: "UTC",
  "UTC+8": "Asia/Shanghai",
  "UTC+9": "Asia/Tokyo",
  "UTC-5": "America/New_York",
};

export function formatDateTime(isoString: string | null, timezone: TimezoneOffset): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const ianaTz = tzMap[timezone];
  return date.toLocaleString("zh-CN", {
    timeZone: ianaTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
