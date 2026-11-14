export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function signedDb(value: number) {
  return `${value >= 0 ? "+" : ""}${formatNumber(value, 2)} dB`;
}

export function formatObservationDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatCoordinate(value: number, axis: "latitude" | "longitude") {
  const direction = axis === "latitude" ? (value < 0 ? "S" : "N") : value < 0 ? "W" : "E";
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}
