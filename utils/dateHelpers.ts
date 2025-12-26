/**
 * Formats a given Date object to a Local YYYY-MM-DD string.
 * This respects the user's device timezone (Wall Clock Time).
 *
 * Use this for grouping logs by day, calculating streaks, or any logic
 * that depends on "Today" as defined by the user's calendar.
 *
 * @param date - Date object to format. Defaults to now if not provided.
 * @returns String in "YYYY-MM-DD" format (e.g., "2023-10-27")
 */
export const toLocalYMD = (
  dateOrString: Date | string = new Date()
): string => {
  let date: Date;

  if (typeof dateOrString === "string") {
    // Handle SQL format "2023-01-01 12:00:00+00" -> "2023-01-01T12:00:00+00"
    // Also handles standard ISO strings.
    const isoString = dateOrString.trim().replace(" ", "T");
    date = new Date(isoString);
  } else {
    date = dateOrString;
  }

  // Check validity
  if (isNaN(date.getTime())) {
    console.warn("toLocalYMD received invalid date:", dateOrString);
    // Fallback to today to avoid breaking UI/Logic, or return safely?
    // Returning correct "today" might hide bugs, but preventing crash is priority.
    // For Logic comparison, returning "Invalid" is safer so we don't accidentally match.
    return "Invalid-Date";
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
