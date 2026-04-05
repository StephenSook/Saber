export type UiClassification = "language" | "content" | "mixed" | "ontrack";

export interface ClassificationColor {
  bg: string;
  text: string;
  dot: string;
  label: string;
}

export function getClassificationColor(
  classification: UiClassification,
): ClassificationColor {
  switch (classification) {
    case "language":
      return {
        bg: "bg-teal",
        text: "text-white",
        dot: "bg-teal",
        label: "Language Barrier",
      };
    case "content":
      return {
        bg: "bg-coral",
        text: "text-white",
        dot: "bg-coral",
        label: "Content Gap",
      };
    case "mixed":
      return {
        bg: "bg-warning",
        text: "text-white",
        dot: "bg-warning",
        label: "Mixed",
      };
    default:
      return {
        bg: "bg-success",
        text: "text-white",
        dot: "bg-success",
        label: "On Track",
      };
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((segment: string) => segment.length > 0)
    .map((segment: string) => segment[0])
    .join("")
    .toUpperCase();
}

export function getInitialsBgColor(name: string): string {
  const colors = ["bg-teal", "bg-coral", "bg-navy", "bg-warning", "bg-success"];
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length] ?? colors[0];
}

export function formatRelativeTime(value: string | null): string {
  if (value === null) {
    return "No activity yet";
  }

  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return "Recently";
  }

  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return "Yesterday";
  }

  return `${diffDays}d ago`;
}
