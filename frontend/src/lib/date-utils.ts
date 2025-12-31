import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isSameDay,
} from "date-fns";

export type DatePreset =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "custom";

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preset?: DatePreset;
}

/**
 * Convert Date to YYYY-MM-DD string in local timezone
 */
export function formatDateToInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD string to Date (start of day in local timezone)
 */
export function parseInputDate(dateString: string): Date {
  return startOfDay(new Date(dateString + "T00:00:00"));
}

/**
 * Get date range for a preset
 */
export function getDateRangeForPreset(preset: DatePreset): DateRange {
  const today = new Date();
  let start: Date;
  let end: Date;

  switch (preset) {
    case "today":
      start = startOfDay(today);
      end = endOfDay(today);
      break;
    case "yesterday":
      const yesterday = subDays(today, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
      break;
    case "thisWeek":
      start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      end = endOfWeek(today, { weekStartsOn: 1 });
      break;
    case "lastWeek":
      const lastWeek = subWeeks(today, 1);
      start = startOfWeek(lastWeek, { weekStartsOn: 1 });
      end = endOfWeek(lastWeek, { weekStartsOn: 1 });
      break;
    case "thisMonth":
      start = startOfMonth(today);
      end = endOfMonth(today);
      break;
    case "lastMonth":
      const lastMonth = subMonths(today, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    case "thisYear":
      start = startOfYear(today);
      end = endOfYear(today);
      break;
    case "lastYear":
      const lastYear = subYears(today, 1);
      start = startOfYear(lastYear);
      end = endOfYear(lastYear);
      break;
    case "custom":
      // Default to today for custom
      start = startOfDay(today);
      end = endOfDay(today);
      break;
  }

  return {
    startDate: formatDateToInput(start),
    endDate: formatDateToInput(end),
    preset,
  };
}

/**
 * Auto-detect preset from date range
 */
export function detectPresetFromRange(range: DateRange): DatePreset {
  if (!range.startDate || !range.endDate) return "custom";

  const start = parseInputDate(range.startDate);
  const end = parseInputDate(range.endDate);

  // Check each preset
  const presets: DatePreset[] = [
    "today",
    "yesterday",
    "thisWeek",
    "lastWeek",
    "thisMonth",
    "lastMonth",
    "thisYear",
    "lastYear",
  ];

  for (const preset of presets) {
    const presetRange = getDateRangeForPreset(preset);
    const presetStart = parseInputDate(presetRange.startDate);
    const presetEnd = parseInputDate(presetRange.endDate);

    if (isSameDay(start, presetStart) && isSameDay(end, presetEnd)) {
      return preset;
    }
  }

  return "custom";
}

/**
 * Get formatted label for preset (for display)
 */
export function getPresetLabel(preset: DatePreset, language: "fr" | "en"): string {
  const labels: Record<DatePreset, { fr: string; en: string }> = {
    today: { fr: "Aujourd'hui", en: "Today" },
    yesterday: { fr: "Hier", en: "Yesterday" },
    thisWeek: { fr: "Cette semaine", en: "This Week" },
    lastWeek: { fr: "Semaine dernière", en: "Last Week" },
    thisMonth: { fr: "Ce mois", en: "This Month" },
    lastMonth: { fr: "Mois dernier", en: "Last Month" },
    thisYear: { fr: "Cette année", en: "This Year" },
    lastYear: { fr: "Année dernière", en: "Last Year" },
    custom: { fr: "Personnalisé", en: "Custom" },
  };

  return labels[preset][language];
}

/**
 * Format date range for display
 */
export function formatDateRange(range: DateRange, language: "fr" | "en"): string {
  if (!range.startDate || !range.endDate) return "";

  const start = parseInputDate(range.startDate);
  const end = parseInputDate(range.endDate);

  const locale = language === "fr" ? "fr-FR" : "en-US";

  if (isSameDay(start, end)) {
    return start.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return `${start.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

/**
 * Format a single date for display (reusable across pages)
 */
export function formatDateDisplay(
  dateString: string,
  language: "fr" | "en",
  options?: {
    includeTime?: boolean;
    format?: "short" | "long";
  }
): string {
  const date = new Date(dateString);
  const locale = language === "fr" ? "fr-FR" : "en-US";

  if (options?.includeTime) {
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (options?.format === "long") {
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

